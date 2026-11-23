"""Provider-neutral storage key helpers and fail-closed UnconfiguredFileStore (infrastructure, adapter).

No domain or HTTP layer depends on a specific storage vendor: every adapter implements core/files.FileStore,
validates keys against KEY_PATTERN, and uses normalize_storage_prefix for optional object prefixes. When storage
credentials are unset (for example during contract export or initial setup), bootstrap.py injects
UnconfiguredFileStore so receipt operations fail closed without writing to local disk.
"""

import re
from collections.abc import Sequence

# A key is a random UUID's 32 hex digits: checked before making any remote request.
KEY_PATTERN = re.compile(r"^[0-9a-f]{32}$")


def normalize_storage_prefix(prefix: str, *, setting_name: str = "prefix") -> str:
    """Normalize an object prefix to '' or '<segment/...>/', rejecting '..' or backslashes."""
    cleaned = prefix.strip().strip("/")
    if not cleaned:
        return ""
    if "\\" in cleaned or ".." in cleaned.split("/"):
        raise ValueError(f"{setting_name} must not contain backslashes or '..'")
    return f"{cleaned}/"


class UnconfiguredFileStore:
    """Refuses every FileStore operation when file storage settings are missing (fail closed)."""

    # Checked by main.py at startup so missing storage settings emit a clear operator warning.
    configured = False

    def __init__(self, missing: Sequence[str]) -> None:
        """Remember which storage settings are missing for the server error message."""
        self._reason = f"File storage isn't configured: set {', '.join(missing)} in .env"

    def save(self, data: bytes) -> str:
        """Raise RuntimeError: receipt bytes are never written without configured object storage."""
        raise RuntimeError(self._reason)

    def read(self, key: str) -> bytes:
        """Raise RuntimeError: configured object storage is required to read receipts."""
        raise RuntimeError(self._reason)

    def delete(self, key: str) -> None:
        """Raise RuntimeError: configured object storage is required to delete receipts."""
        raise RuntimeError(self._reason)
