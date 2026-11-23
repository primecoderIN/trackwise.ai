"""Pure helpers and wire-format parsing for the Backblaze B2 Native API (v3) (infrastructure/storage).

Used only by infrastructure/storage/b2.py: validates HTTPS endpoint URLs returned by B2, parses
b2_authorize_account and b2_get_upload_url responses, and filters matching file versions without I/O.
"""

from dataclasses import dataclass
from typing import Any
from urllib.parse import urlsplit

from app.core.errors import ExternalServiceError

AUTHORIZE_URL = "https://api.backblazeb2.com/b2api/v3/b2_authorize_account"
B2_API_PATH = "/b2api/v3"


@dataclass(frozen=True)
class B2Config:
    """Connection settings for one private Backblaze B2 bucket (`bucket_id` is resolved once if omitted)."""

    key_id: str
    application_key: str
    bucket_name: str
    bucket_id: str | None = None
    prefix: str = "receipts/"


@dataclass(frozen=True)
class B2Session:
    """Authorized Backblaze B2 session for one bucket: account token, endpoints, and resolved bucket id."""

    account_id: str
    token: str
    api_url: str
    download_url: str
    bucket_id: str


@dataclass(frozen=True)
class UploadTarget:
    """Single-concurrent-upload target and upload token returned by b2_get_upload_url."""

    upload_url: str
    token: str


def https_url(value: object, name: str) -> str:
    """Validate that a B2 endpoint URL uses HTTPS with a host; raise ExternalServiceError otherwise."""
    if not isinstance(value, str) or not value.strip():
        raise ExternalServiceError(f"Backblaze B2 response omitted {name}")
    parts = urlsplit(value)
    if parts.scheme != "https" or not parts.netloc:
        raise ExternalServiceError(f"Backblaze B2 returned invalid {name}")
    return value.rstrip("/")


def json_dict(payload: object, action: str) -> dict[str, Any]:
    """Ensure a parsed JSON body is a dict, raising ExternalServiceError otherwise."""
    if not isinstance(payload, dict):
        raise ExternalServiceError(f"Backblaze B2 {action} returned non-object JSON")
    return payload


def parse_authorize_head(payload: dict[str, Any]) -> tuple[str, str, str, str, dict[str, Any]]:
    """Extract `(account_id, token, api_url, download_url, storage_api)` from b2_authorize_account JSON."""
    account_id = payload.get("accountId")
    token = payload.get("authorizationToken")
    api_info = payload.get("apiInfo")
    storage_api = api_info.get("storageApi") if isinstance(api_info, dict) else None
    if (
        not isinstance(account_id, str)
        or not account_id
        or not isinstance(token, str)
        or not token
        or not isinstance(storage_api, dict)
    ):
        raise ExternalServiceError("Backblaze B2 authorize returned unexpected payload")
    api_url = https_url(storage_api.get("apiUrl"), "apiUrl")
    download_url = https_url(storage_api.get("downloadUrl"), "downloadUrl")
    return account_id, token, api_url, download_url, storage_api


def bucket_id_from_allowed(storage_api: dict[str, Any], bucket_name: str) -> str | None:
    """Read `bucket_name`'s id from `allowed.buckets` when the key is scoped to specific buckets."""
    allowed = storage_api.get("allowed")
    buckets = allowed.get("buckets") if isinstance(allowed, dict) else None
    if not isinstance(buckets, list):
        return None
    for entry in buckets:
        if isinstance(entry, dict) and entry.get("name") == bucket_name:
            bucket_id = entry.get("id")
            if isinstance(bucket_id, str) and bucket_id:
                return bucket_id
    return None


def bucket_id_from_list(listed: dict[str, Any], bucket_name: str) -> str | None:
    """Read `bucket_name`'s id from a `b2_list_buckets` JSON payload."""
    buckets = listed.get("buckets")
    if not isinstance(buckets, list):
        return None
    for entry in buckets:
        if isinstance(entry, dict) and entry.get("bucketName") == bucket_name:
            bucket_id = entry.get("bucketId")
            if isinstance(bucket_id, str) and bucket_id:
                return bucket_id
    return None


def parse_upload_target(payload: dict[str, Any]) -> UploadTarget:
    """Validate and extract an UploadTarget from a `b2_get_upload_url` response."""
    upload_url = https_url(payload.get("uploadUrl"), "uploadUrl")
    token = payload.get("authorizationToken")
    if not isinstance(token, str) or not token:
        raise ExternalServiceError("Backblaze B2 b2_get_upload_url omitted authorizationToken")
    return UploadTarget(upload_url=upload_url, token=token)


def matching_versions(listed: dict[str, Any], object_name: str) -> tuple[list[tuple[str, str]], str | None, str | None]:
    """Extract exact `object_name` `(fileName, fileId)` pairs and next-page cursor from `b2_list_file_versions`."""
    versions: list[tuple[str, str]] = []
    files = listed.get("files")
    if isinstance(files, list):
        for entry in files:
            if isinstance(entry, dict) and entry.get("fileName") == object_name:
                file_id = entry.get("fileId")
                if isinstance(file_id, str) and file_id:
                    versions.append((object_name, file_id))
    next_name = listed.get("nextFileName")
    next_id = listed.get("nextFileId")
    if not isinstance(next_name, str) or not next_name.startswith(object_name):
        return versions, None, None
    return versions, next_name, next_id if isinstance(next_id, str) else None
