"""LocalFileStore: the FileStore port (core/files.py) as a folder on this machine (infrastructure, adapter).

The composition root (bootstrap.py) builds one on UPLOADS_DIR and hands it to the receipts module. Files are named
by random keys, never by anything a user sent, and a key that isn't one of ours is refused before it becomes a path,
so a request can't read or write outside the folder.
"""

import os
import re
import uuid
from pathlib import Path

# A key is a random UUID's 32 hex digits: nothing else may become a file name (no "..", no slashes).
KEY_PATTERN = re.compile(r"^[0-9a-f]{32}$")


class LocalFileStore:
    """Files in one folder, created on first save. Used by the receipts module, through the FileStore port."""

    def __init__(self, root: Path) -> None:
        """Keep files in `root` (created when the first file is saved, not now: nothing happens at import)."""
        self._root = root

    def _path(self, key: str) -> Path:
        """The file for `key`. Raises FileNotFoundError for a key this store can't have made."""
        if not KEY_PATTERN.fullmatch(key):
            raise FileNotFoundError(key)
        return self._root / key

    def save(self, data: bytes) -> str:
        """Atomically write `data` to a new file named by a random key, and return the key."""
        self._root.mkdir(parents=True, exist_ok=True)
        key = uuid.uuid4().hex
        target = self._path(key)
        staging = self._root / f".tmp-{key}"
        try:
            with open(staging, "xb") as file:
                file.write(data)
            os.replace(staging, target)
        except BaseException:
            staging.unlink(missing_ok=True)
            raise
        return key

    def read(self, key: str) -> bytes:
        """The file's bytes. Raises FileNotFoundError if it's missing or the key isn't one of ours."""
        return self._path(key).read_bytes()

    def delete(self, key: str) -> None:
        """Remove the file, if it's there (a malformed or missing key is a no-op, per FileStore)."""
        if not KEY_PATTERN.fullmatch(key):
            return
        (self._root / key).unlink(missing_ok=True)
