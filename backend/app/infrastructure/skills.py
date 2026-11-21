"""The SkillLibrary port over a folder: FolderSkillLibrary reads skills/<name>/SKILL.md and the files beside it.

Infrastructure: the only code that reads skills from disk. The composition root builds it on SKILLS_DIR (the project's
skills/ folder) and passes it in. It reads the folder once, on first use, and keeps what it found (restart to pick up
an edited skill). A skill is kept only if it follows the format (agentskills.io/specification, D208):

- frontmatter between "---" lines with `name` (1-64 characters: lowercase letters, digits and single hyphens, not at
  either end, the same as the folder's name) and `description` (1-1024 characters); other fields are ignored. Only
  simple "key: value" lines are read (no YAML library is installed for this): enough for these two fields;
- a body (the instructions) and its files under references/ and assets/, each at most MAX_FILE_BYTES. scripts/ are
  never read out: the server runs them (run_script, D209), the model doesn't see their code.

A script runs in a child process of this Python (`-I`: isolated, no user site, no current folder on the path), from
the skill's folder, with its JSON input on stdin and a time limit (SCRIPT_TIMEOUT_SECONDS); its stdout must be one
JSON object (at most MAX_SCRIPT_OUTPUT bytes). No shell is involved, and only scripts listed when the folder was read
can run.

A file can only be read if it was listed when the folder was read: a name the model sends is looked up, never joined
to a path, so nothing outside a skill's folder can be reached.
"""

import json
import logging
import os
import re
import subprocess
import sys
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.skills import SkillNotFoundError, SkillScriptError, SkillSummary

logger = logging.getLogger(__name__)

SKILL_FILE = "SKILL.md"
READABLE_FOLDERS = ("references", "assets")
SCRIPTS_FOLDER = "scripts"
SCRIPT_SUFFIX = ".py"
SCRIPT_TIMEOUT_SECONDS = 10
MAX_SCRIPT_OUTPUT = 1024 * 1024
MAX_SCRIPT_STDERR = 4096
# Allow-listed OS variables needed to start Python on Windows/POSIX; never pass app secrets (API keys, DB URL).
_SAFE_ENV_VARS = ("SYSTEMROOT", "WINDIR", "COMSPEC", "PATH", "TMP", "TEMP", "HOME", "LANG", "LC_ALL")
NAME_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MAX_NAME = 64
MAX_DESCRIPTION = 1024
MAX_FILE_BYTES = 64 * 1024
FRONTMATTER = re.compile(r"\A---\r?\n(.*?)\r?\n---\r?\n?(.*)\Z", re.DOTALL)
FIELD = re.compile(r"^([A-Za-z_-]+):\s*(.*)$")


def _script_env() -> dict[str, str]:
    """Minimal environment for child skill scripts: OS basics + UTF-8 mode, never backend secrets."""
    env = {key: value for key in _SAFE_ENV_VARS if (value := os.environ.get(key)) is not None}
    env["PYTHONUTF8"] = "1"
    return env


def _read_bounded(stream: Any, limit: int) -> tuple[bytes, bool]:
    """Read at most `limit + 1` bytes from `stream`; returns `(data, exceeded)` without unbounded RAM buffering."""
    chunks: list[bytes] = []
    total = 0
    while chunk := stream.read(min(8192, limit + 1 - total)):
        chunks.append(chunk)
        total += len(chunk)
        if total > limit:
            return b"".join(chunks), True
    return b"".join(chunks), False


def _run_bounded_process(script_path: Path, cwd: Path, payload_bytes: bytes, label: str) -> bytes:
    """Run one isolated Python script with bounded stdout/stderr and a wall-clock timeout. Returns stdout bytes."""
    proc = subprocess.Popen(
        [sys.executable, "-I", "-X", "utf8", str(script_path)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=cwd,
        env=_script_env(),
    )
    assert proc.stdin is not None and proc.stdout is not None and proc.stderr is not None
    stdout_box: list[tuple[bytes, bool]] = []
    stderr_box: list[tuple[bytes, bool]] = []
    t_out = threading.Thread(target=lambda: stdout_box.append(_read_bounded(proc.stdout, MAX_SCRIPT_OUTPUT)))
    t_err = threading.Thread(target=lambda: stderr_box.append(_read_bounded(proc.stderr, MAX_SCRIPT_STDERR)))
    t_out.start()
    t_err.start()
    try:
        try:
            proc.stdin.write(payload_bytes)
            proc.stdin.close()
        except BrokenPipeError:
            pass
        proc.wait(timeout=SCRIPT_TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired as exc:
        proc.kill()
        proc.wait()
        t_out.join(timeout=1)
        t_err.join(timeout=1)
        raise SkillScriptError(f"{label}: {exc!r}") from exc
    t_out.join(timeout=2)
    t_err.join(timeout=2)
    stdout_bytes, exceeded = stdout_box[0] if stdout_box else (b"", False)
    stderr_bytes, _ = stderr_box[0] if stderr_box else (b"", False)
    if exceeded:
        raise SkillScriptError(f"{label} exceeded {MAX_SCRIPT_OUTPUT} bytes of output")
    if proc.returncode != 0:
        err_text = stderr_bytes.decode("utf-8", errors="replace")[-500:]
        raise SkillScriptError(f"{label} exited {proc.returncode}: {err_text}")
    return stdout_bytes


@dataclass(frozen=True)
class _Skill:
    summary: SkillSummary
    body: str
    folder: Path
    scripts: tuple[str, ...]


class FolderSkillLibrary:
    """SkillLibrary over a folder of skills (`root`), read once."""

    def __init__(self, root: Path) -> None:
        """Remember the folder; nothing is read until the catalog is first asked for."""
        self._root = root
        self._skills: dict[str, _Skill] | None = None
        self._lock = threading.Lock()

    def catalog(self) -> list[SkillSummary]:
        """Every valid skill, by name."""
        return [skill.summary for _, skill in sorted(self._loaded().items())]

    def read(self, name: str, file: str | None = None) -> str:
        """The skill's instructions, or one of its listed files. Raises SkillNotFoundError otherwise."""
        skill = self._loaded().get(name)
        if skill is None or (file is not None and file not in skill.summary.files):
            raise SkillNotFoundError(f"{name}/{file or SKILL_FILE}")
        if file is None:
            return skill.body
        target = skill.folder / file
        try:
            if target.is_symlink() or not target.resolve().is_relative_to(skill.folder.resolve()):
                raise SkillNotFoundError(f"{name}/{file}")
            if target.stat().st_size > MAX_FILE_BYTES:
                raise SkillNotFoundError(f"{name}/{file}")
            return target.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            raise SkillNotFoundError(f"{name}/{file}") from exc

    def run_script(self, name: str, script: str, payload: dict[str, Any]) -> dict[str, Any]:
        """Run one of the skill's listed Python scripts with `payload` on stdin; return its JSON output. Raises
        SkillNotFoundError for an unlisted script, SkillScriptError if it fails, times out or answers no JSON
        object."""
        skill = self._loaded().get(name)
        if skill is None or script not in skill.scripts:
            raise SkillNotFoundError(f"{name}/{script}")
        label = f"{name}/{script}"
        try:
            stdout_bytes = _run_bounded_process(
                skill.folder / script, skill.folder, json.dumps(payload).encode("utf-8"), label
            )
        except OSError as exc:
            raise SkillScriptError(f"{label}: {exc!r}") from exc
        try:
            output = json.loads(stdout_bytes.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise SkillScriptError(f"{label} answered no JSON") from exc
        if not isinstance(output, dict):
            raise SkillScriptError(f"{label} answered no JSON object")
        return output

    def _loaded(self) -> dict[str, _Skill]:
        """The skills, read from the folder the first time."""
        with self._lock:
            if self._skills is None:
                folders = sorted(self._root.iterdir()) if self._root.is_dir() else []
                found = [_read_skill(folder) for folder in folders if (folder / SKILL_FILE).is_file()]
                self._skills = {skill.summary.name: skill for skill in found if skill is not None}
                logger.info("skills: %s", sorted(self._skills))
            return self._skills


def _read_skill(folder: Path) -> _Skill | None:
    """The skill in `folder`, or None (with a warning saying why) if it doesn't follow the format."""
    skill_path = folder / SKILL_FILE
    if skill_path.is_symlink() or skill_path.stat().st_size > MAX_FILE_BYTES:
        logger.warning("skill %s skipped: SKILL.md is a symlink or over %d bytes", folder.name, MAX_FILE_BYTES)
        return None
    match = FRONTMATTER.match(skill_path.read_text(encoding="utf-8"))
    if match is None:
        logger.warning("skill %s skipped: no frontmatter", folder.name)
        return None
    fields = {m.group(1): m.group(2) for line in match.group(1).splitlines() if (m := FIELD.match(line.strip()))}
    name, description = _unquoted(fields.get("name", "")), _unquoted(fields.get("description", ""))
    if not (len(name) <= MAX_NAME and NAME_PATTERN.match(name) and name == folder.name):
        logger.warning(
            "skill %s skipped: its name must be the folder's, in lowercase letters, digits and hyphens", folder.name
        )
        return None
    if not 0 < len(description) <= MAX_DESCRIPTION:
        logger.warning("skill %s skipped: its description must be 1 to %d characters", name, MAX_DESCRIPTION)
        return None
    files = tuple(sorted(_readable_files(folder)))
    scripts_folder = folder / SCRIPTS_FOLDER
    resolved_root = folder.resolve()
    scripts = tuple(
        sorted(
            p.relative_to(folder).as_posix()
            for p in scripts_folder.iterdir()
            if p.suffix == SCRIPT_SUFFIX
            and not p.is_symlink()
            and p.is_file()
            and p.resolve().is_relative_to(resolved_root)
        )
        if scripts_folder.is_dir() and not scripts_folder.is_symlink()
        else ()
    )
    return _Skill(SkillSummary(name, description, files), match.group(2).strip(), folder, scripts)


def _readable_files(folder: Path) -> list[str]:
    """The skill's files the model may read: directly under references/ or assets/ (one level deep, no symlinks)."""
    files = []
    resolved_root = folder.resolve()
    for sub in READABLE_FOLDERS:
        sub_dir = folder / sub
        if not sub_dir.is_dir() or sub_dir.is_symlink():
            continue
        for path in sub_dir.iterdir():
            if (
                not path.is_symlink()
                and path.is_file()
                and path.resolve().is_relative_to(resolved_root)
                and path.stat().st_size <= MAX_FILE_BYTES
            ):
                files.append(path.relative_to(folder).as_posix())
    return files


def _unquoted(value: str) -> str:
    """A frontmatter value without surrounding quotes."""
    value = value.strip()
    return value[1:-1] if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'" else value
