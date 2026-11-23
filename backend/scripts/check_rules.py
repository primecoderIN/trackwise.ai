"""Check the codebase's architecture rules (AGENTS.md section 2; docs/architecture.md, "Checking the rules").

A development tool, not part of the app: it reads the source (Python's ast, for imports; plain text, for names), never
imports the app, except for rule 6, which imports each module package in a fresh interpreter to catch import cycles.
Run it from the project folder (backend/scripts/check.py runs it with the other checks, locally and in CI):

    .\\.venv\\Scripts\\python.exe backend\\scripts\\check_rules.py

Prints each broken rule with the files that break it, and exits 1 if any rule is broken.
"""

import ast
import os
import re
import subprocess
import sys
from collections.abc import Callable, Iterable
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
APP = BACKEND / "app"
AGENTS = ROOT / "agents"
WEB_SRC = ROOT / "web" / "src"
MODULES = APP / "modules"
ENTRY_SCRIPTS = (BACKEND / "seed.py", BACKEND / "mcp_stdio.py")
AGENT_PACKAGES = ("receipt", "insights", "currency", "agent_kit")

# Which modules each module may use (AGENTS.md, "Boundaries"); "*" means any other module.
ALLOWED_MODULE_DEPENDENCIES: dict[str, set[str]] = {
    "accounts": set(),
    "categories": set(),
    "conversations": set(),
    "receipts": set(),
    "expenses": {"categories"},
    "budgets": {"expenses", "categories"},
    "reports": {"expenses", "categories"},
    "mcp": {"expenses", "categories", "reports", "budgets"},
    "assistant": {"*"},
}
# The only module files that may import web/: the HTTP adapters (exact paths relative to backend/app/modules/).
HTTP_ADAPTERS = {
    "accounts/api.py",
    "accounts/account_api.py",
    "assistant/api/routes.py",
    "budgets/api.py",
    "categories/api.py",
    "conversations/api.py",
    "expenses/api.py",
    "mcp/http.py",
    "receipts/api.py",
    "reports/api.py",
}
# Where the Gemini adapter may be chosen: the composition root, the adapter itself, and each agent's server.py.
LLM_PROVIDER_PATTERN = re.compile(r"llm\.gemini|from google")
LLM_PROVIDER_FILES = {
    "backend/app/bootstrap.py",
    "backend/app/infrastructure/llm/gemini.py",
    "agents/receipt/server.py",
    "agents/insights/server.py",
    "agents/currency/server.py",
}
# The only backend infrastructure modules an agent's server.py may import (D196).
ALLOWED_AGENT_INFRA = ("app.infrastructure.llm.gemini", "app.infrastructure.logging")
# Where a file-storage vendor adapter may be referenced: only bootstrap.py and infrastructure/storage/ (D221).
STORAGE_PROVIDER_PATTERN = re.compile(r"infrastructure\.storage\.|backblazeb2|\bB2FileStore\b|\bB2Config\b")
STORAGE_PROVIDER_FILES = {
    "backend/app/bootstrap.py",
    "backend/app/infrastructure/storage/b2.py",
    "backend/app/infrastructure/storage/b2_wire.py",
}
# No identity provider's name in the code (D185).
PROVIDER_NAMES = re.compile(r"zitadel", re.IGNORECASE)
# A person's data is read with its owner in the same statement (D190), never session.get(Table, id).
OWNED_DATA_MODULES = ("accounts", "expenses", "budgets", "conversations", "receipts", "assistant")
SESSION_GET = re.compile(r"session\.get\(")
SESSION_GET_ALLOWED: set[str] = set()


def python_files(*roots: Path) -> Iterable[Path]:
    """Every .py file under `roots` (or a file passed directly), skipping caches."""
    for root in roots:
        if root.is_file():
            yield root
        else:
            yield from (path for path in root.rglob("*.py") if "__pycache__" not in path.parts)


def _package_parts(path: Path) -> tuple[str, ...]:
    """The dotted package enclosing `path` inside backend/ or agents/."""
    base = AGENTS if path.is_relative_to(AGENTS) else BACKEND if path.is_relative_to(BACKEND) else ROOT
    parts = path.relative_to(base).with_suffix("").parts
    return parts[:-1]


def _is_submodule(base: str, name: str) -> bool:
    """Whether `name` is a file or package inside `base` (e.g. `app.modules.expenses` -> `values` or `module`)."""
    parts = base.split(".")
    if parts[:2] != ["app", "modules"] or len(parts) != 3:
        return name == "module"
    module_dir = MODULES / parts[2]
    return (module_dir / f"{name}.py").exists() or (module_dir / name).is_dir()


def _resolve_import_from(path: Path, node: ast.ImportFrom) -> list[str]:
    """Resolve an `ImportFrom` node (absolute or relative) to absolute dotted module names."""
    if node.level == 0:
        base = node.module or ""
    else:
        pkg = _package_parts(path)
        up = max(0, len(pkg) - (node.level - 1))
        prefix = pkg[:up]
        base = ".".join((*prefix, node.module) if node.module else prefix)
    if not base:
        return [alias.name for alias in node.names]
    if base in ("app.modules", "app"):
        return [f"{base}.{alias.name}" for alias in node.names]
    resolved = [base]
    for alias in node.names:
        if _is_submodule(base, alias.name):
            resolved.append(f"{base}.{alias.name}")
    return resolved


def imports_of(path: Path) -> list[str]:
    """Every module `path` imports, with relative imports resolved to absolute names."""
    names: list[str] = []
    for node in ast.walk(ast.parse(path.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            names += [alias.name for alias in node.names]
        elif isinstance(node, ast.ImportFrom):
            names += _resolve_import_from(path, node)
    return names


def imports_a_module_py(path: Path) -> bool:
    """Whether `path` imports any module's `module.py` wiring."""
    for name in imports_of(path):
        parts = name.split(".")
        if parts[:2] == ["app", "modules"] and len(parts) >= 4 and parts[3] == "module":
            return True
    return False


def relative(path: Path) -> str:
    """`path` relative to the project folder, with forward slashes."""
    return path.relative_to(ROOT).as_posix()


def layer_rules() -> list[str]:
    """1. core/ imports nothing else in the app; infrastructure/ and web/ import only core/; modules never import
    infrastructure/ or the composition root (D177)."""
    forbidden = {
        "core": ("app.modules", "app.infrastructure", "app.web", "app.bootstrap", "app.main", "app.agents_host"),
        "infrastructure": ("app.modules", "app.web", "app.bootstrap", "app.main", "app.agents_host"),
        "web": ("app.modules", "app.infrastructure", "app.bootstrap", "app.main", "app.agents_host"),
        "modules": ("app.infrastructure", "app.bootstrap", "app.main", "app.agents_host"),
    }
    return [
        f"{relative(path)} imports {name}"
        for layer, prefixes in forbidden.items()
        for path in python_files(APP / layer)
        for name in imports_of(path)
        if name.startswith(prefixes)
    ]


def module_rules() -> list[str]:
    """2. Another module is used only through its package; 3. only bootstrap.py and main.py import a module.py;
    13. module dependencies follow the allowed graph (no cycles)."""
    problems = []
    for path in python_files(MODULES):
        owner = path.relative_to(MODULES).parts[0]
        for name in imports_of(path):
            parts = name.split(".")
            if parts[:2] != ["app", "modules"] or len(parts) < 3 or parts[2] == owner:
                continue
            other = parts[2]
            if len(parts) > 3:
                problems.append(f"{relative(path)} imports {name}: use the `{other}` package, not its files")
            allowed = ALLOWED_MODULE_DEPENDENCIES.get(owner, set())
            if "*" not in allowed and other not in allowed:
                problems.append(f"{relative(path)}: `{owner}` may not depend on `{other}`")
    allowed_wiring = {relative(APP / "bootstrap.py"), relative(APP / "main.py")}
    for path in python_files(APP, BACKEND / "scripts", BACKEND / "migrations", *ENTRY_SCRIPTS):
        if relative(path) not in allowed_wiring and imports_a_module_py(path):
            problems.append(f"{relative(path)} imports a module.py: only bootstrap.py and main.py may")
    return problems


def text_rules() -> list[str]:
    """4. Only a composition root picks the LLM provider; 8. no identity provider's name; 9. no session.get( on a
    person's data; 14. only bootstrap.py picks the file-storage provider."""
    problems = []
    for path in python_files(APP, AGENTS, *ENTRY_SCRIPTS):
        if LLM_PROVIDER_PATTERN.search(path.read_text(encoding="utf-8")) and relative(path) not in LLM_PROVIDER_FILES:
            problems.append(f"{relative(path)} picks the LLM provider")
    sources = [*python_files(APP, AGENTS, *ENTRY_SCRIPTS), *WEB_SRC.rglob("*.ts"), *WEB_SRC.rglob("*.tsx")]
    for path in sources:
        content = path.read_text(encoding="utf-8")
        if PROVIDER_NAMES.search(content):
            problems.append(f"{relative(path)} names an identity provider")
        if STORAGE_PROVIDER_PATTERN.search(content) and relative(path) not in STORAGE_PROVIDER_FILES:
            problems.append(f"{relative(path)} references a file-storage vendor adapter directly")
    for module in OWNED_DATA_MODULES:
        for path in python_files(MODULES / module):
            if relative(path) not in SESSION_GET_ALLOWED and SESSION_GET.search(path.read_text(encoding="utf-8")):
                problems.append(f"{relative(path)} reads a row by id alone (session.get): name the owner too")
    return problems


def assistant_rules() -> list[str]:
    """5. Inside the assistant, imports run api/ -> application/ -> the rest, never back (module.py builds both)."""
    assistant = MODULES / "assistant"
    problems = []
    for path in python_files(assistant):
        inside = path.relative_to(assistant).parts[0]
        for name in imports_of(path):
            if name.startswith("app.modules.assistant.api") and inside not in ("api", "module.py"):
                problems.append(f"{relative(path)} imports the assistant's api/")
            if name.startswith("app.modules.assistant.application") and inside not in (
                "api",
                "application",
                "module.py",
            ):
                problems.append(f"{relative(path)} imports the assistant's application/")
    return problems


def adapter_rules() -> list[str]:
    """7. Only a module's HTTP adapters import web/; 12. only infrastructure/a2a uses the A2A SDK."""
    problems = [
        f"{relative(path)} imports web/ but isn't an HTTP adapter"
        for path in python_files(MODULES)
        if path.relative_to(MODULES).as_posix() not in HTTP_ADAPTERS
        and any(name.startswith("app.web") for name in imports_of(path))
    ]
    problems += [
        f"{relative(path)} imports the A2A SDK"
        for path in python_files(APP)
        if "infrastructure/a2a" not in relative(path) and any(n.split(".")[0] == "a2a" for n in imports_of(path))
    ]
    return problems


def agent_rules() -> list[str]:
    """10. The agents use only the backend's core/ (plus the Gemini adapter and logging in a server.py); in the
    backend, only agents_host.py imports them (D196, D207)."""
    problems = []
    for path in python_files(AGENTS):
        is_server = path.parent.parent == AGENTS and path.name == "server.py"
        for name in imports_of(path):
            if not name.startswith("app."):
                continue
            if name == "app.core" or name.startswith("app.core."):
                continue
            if is_server and name.startswith(ALLOWED_AGENT_INFRA):
                continue
            problems.append(f"{relative(path)} imports {name}")
    for path in python_files(APP):
        if relative(path) != relative(APP / "agents_host.py") and any(
            n.split(".")[0] in AGENT_PACKAGES for n in imports_of(path)
        ):
            problems.append(f"{relative(path)} imports an agent: only agents_host.py may")
    return problems


def import_rules() -> list[str]:
    """6. Each module package imports on its own (a failure usually means an import cycle); 11. so do the agents."""
    checks = [
        f"import app.modules.{path.name}" for path in sorted(MODULES.iterdir()) if (path / "__init__.py").exists()
    ]
    checks += ["import receipt.server", "import insights.server", "import currency.server", "import agent_kit"]
    environment = {**os.environ, "PYTHONPATH": os.pathsep.join([str(BACKEND), str(AGENTS)])}
    problems = []
    for statement in checks:
        done = subprocess.run(
            [sys.executable, "-c", statement], capture_output=True, text=True, env=environment, check=False
        )
        if done.returncode != 0:
            lines = done.stderr.strip().splitlines()
            reason = lines[-1] if lines else f"exit code {done.returncode}"
            problems.append(f"`{statement}` fails on its own: {reason}")
    return problems


RULES: list[tuple[str, Callable[[], list[str]]]] = [
    ("layers (1)", layer_rules),
    ("modules (2, 3, 13)", module_rules),
    ("LLM provider, identity, owners, storage (4, 8, 9, 14)", text_rules),
    ("the assistant's layers (5)", assistant_rules),
    ("HTTP adapters and the A2A SDK (7, 12)", adapter_rules),
    ("agents (10)", agent_rules),
    ("packages import on their own (6, 11)", import_rules),
]


def main() -> int:
    """Run every rule; print what breaks; 0 if none does."""
    broken = 0
    for title, rule in RULES:
        problems = rule()
        print(f"{'ok  ' if not problems else 'FAIL'} {title}")
        for problem in problems:
            print(f"       {problem}")
        broken += bool(problems)
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
