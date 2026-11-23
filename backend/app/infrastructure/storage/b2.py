"""B2FileStore: the FileStore port (core/files.py) on a private Backblaze B2 bucket (infrastructure/storage).

Speaks Backblaze B2's Native API (v3) over httpx (no extra SDK dependency), keeping receipts private:
- save(): authorizes if needed, fetches or reuses an upload URL, uploads bytes with SHA-1 check under <prefix><key>;
- read(): downloads the latest version by name with the account token (404 -> FileNotFoundError);
- delete(): lists matching file versions and deletes each (missing files are a no-op).

Only bootstrap.py imports this adapter, behind the FileStore port.
"""

import hashlib
import threading
import uuid
from typing import Any
from urllib.parse import quote

import httpx

from app.core.errors import ExternalServiceError
from app.infrastructure.files import KEY_PATTERN, normalize_storage_prefix
from app.infrastructure.storage.b2_wire import (
    AUTHORIZE_URL,
    B2_API_PATH,
    B2Config,
    B2Session,
    UploadTarget,
    bucket_id_from_allowed,
    bucket_id_from_list,
    json_dict,
    matching_versions,
    parse_authorize_head,
    parse_upload_target,
)

HTTP_TIMEOUT_SECONDS = 30.0
MAX_CACHED_UPLOAD_TARGETS = 8
MAX_ATTEMPTS = 2
LIST_MAX_COUNT = 100
OCTET_STREAM = "application/octet-stream"
FILE_NOT_PRESENT = "file_not_present"
RETRY_STATUSES = (408, 429, 500, 502, 503, 504)


def _response_json(response: httpx.Response, action: str) -> dict[str, Any]:
    """Parse JSON from an HTTP response and verify it is an object."""
    try:
        payload = response.json()
    except ValueError as exc:
        raise ExternalServiceError(f"Backblaze B2 {action} returned non-JSON") from exc
    return json_dict(payload, action)


def _b2_error_code(response: httpx.Response) -> str | None:
    """Extract B2's JSON `code` field from an error response, if present."""
    try:
        payload = response.json()
    except ValueError:
        return None
    code = payload.get("code") if isinstance(payload, dict) else None
    return code if isinstance(code, str) else None


class B2FileStore:
    """Files in a private Backblaze B2 bucket, keyed by 32-hex UUIDs. Safe across worker threads."""

    # Signals main.py at startup that a live FileStore adapter is active (vs UnconfiguredFileStore).
    configured = True

    def __init__(self, config: B2Config, *, transport: httpx.BaseTransport | None = None) -> None:
        """Remember credentials and bucket config; nothing connects until the first save, read or delete."""
        self._config = B2Config(
            key_id=config.key_id,
            application_key=config.application_key,
            bucket_name=config.bucket_name,
            bucket_id=config.bucket_id,
            prefix=normalize_storage_prefix(config.prefix, setting_name="B2_PREFIX"),
        )
        self._http = httpx.Client(transport=transport, timeout=HTTP_TIMEOUT_SECONDS)
        self._lock = threading.Lock()
        self._session: B2Session | None = None
        # B2 allows one concurrent upload per uploadUrl; pool idle targets so concurrent threads never collide.
        self._upload_targets: list[UploadTarget] = []

    def close(self) -> None:
        """Close the underlying HTTP connection pool."""
        self._http.close()

    def save(self, data: bytes) -> str:
        """Upload `data` under a fresh 32-hex key with SHA-1 verification and return the key."""
        key = uuid.uuid4().hex
        headers = {
            "X-Bz-File-Name": quote(f"{self._config.prefix}{key}", safe="/"),
            "Content-Type": OCTET_STREAM,
            "Content-Length": str(len(data)),
            "X-Bz-Content-Sha1": hashlib.sha1(data).hexdigest(),
        }
        for attempt in range(MAX_ATTEMPTS):
            session, target = self._acquire_upload_target()
            try:
                response = self._http.post(
                    target.upload_url, headers={"Authorization": target.token, **headers}, content=data
                )
            except httpx.HTTPError as exc:
                if attempt + 1 < MAX_ATTEMPTS:
                    continue
                raise ExternalServiceError("Backblaze B2 upload request failed") from exc
            if response.status_code == httpx.codes.OK:
                self._release_upload_target(session, target)
                return key
            if response.status_code == httpx.codes.UNAUTHORIZED:
                self._invalidate_session(session)
            if (response.status_code == httpx.codes.UNAUTHORIZED or response.status_code in RETRY_STATUSES) and (
                attempt + 1 < MAX_ATTEMPTS
            ):
                continue
            raise ExternalServiceError(f"Backblaze B2 upload failed ({response.status_code})")
        raise ExternalServiceError("Backblaze B2 upload failed")

    def read(self, key: str) -> bytes:
        """Download bytes for `key`. Raises FileNotFoundError if missing/malformed, ExternalServiceError on failure."""
        if not KEY_PATTERN.fullmatch(key):
            raise FileNotFoundError(key)
        bucket = quote(self._config.bucket_name, safe="")
        object_name = quote(f"{self._config.prefix}{key}", safe="/")
        for attempt in range(MAX_ATTEMPTS):
            session = self._authorize()
            url = f"{session.download_url}/file/{bucket}/{object_name}"
            try:
                response = self._http.get(url, headers={"Authorization": session.token})
            except httpx.HTTPError as exc:
                if attempt + 1 < MAX_ATTEMPTS:
                    continue
                raise ExternalServiceError("Backblaze B2 download request failed") from exc
            if response.status_code == httpx.codes.OK:
                return response.content
            if response.status_code == httpx.codes.NOT_FOUND:
                raise FileNotFoundError(key)
            if response.status_code == httpx.codes.UNAUTHORIZED:
                self._invalidate_session(session)
                if attempt + 1 < MAX_ATTEMPTS:
                    continue
            elif response.status_code in RETRY_STATUSES and attempt + 1 < MAX_ATTEMPTS:
                continue
            raise ExternalServiceError(f"Backblaze B2 download failed ({response.status_code})")
        raise ExternalServiceError("Backblaze B2 download failed")

    def delete(self, key: str) -> None:
        """Delete all stored versions for `key`; missing or malformed keys are a no-op."""
        if not KEY_PATTERN.fullmatch(key):
            return
        object_name = f"{self._config.prefix}{key}"
        for file_name, file_id in self._list_versions(object_name):
            self._post_api(
                f"{B2_API_PATH}/b2_delete_file_version",
                {"fileName": file_name, "fileId": file_id},
                allow_not_found=True,
            )

    def _authorize(self) -> B2Session:
        """Return a cached B2 session or authorize via b2_authorize_account under the lock."""
        with self._lock:
            if self._session is not None:
                return self._session
            auth = httpx.BasicAuth(self._config.key_id, self._config.application_key)
            try:
                response = self._http.get(AUTHORIZE_URL, auth=auth)
            except httpx.HTTPError as exc:
                raise ExternalServiceError("Backblaze B2 authorize request failed") from exc
            if response.status_code != httpx.codes.OK:
                raise ExternalServiceError(f"Backblaze B2 authorize failed ({response.status_code})")
            payload = _response_json(response, "authorize")
            account_id, token, api_url, download_url, storage_api = parse_authorize_head(payload)
            bucket_id = self._resolve_bucket_id(storage_api, api_url, token, account_id)
            self._session = B2Session(
                account_id=account_id, token=token, api_url=api_url, download_url=download_url, bucket_id=bucket_id
            )
            return self._session

    def _resolve_bucket_id(self, storage_api: dict[str, Any], api_url: str, token: str, account_id: str) -> str:
        """Resolve `bucket_id` from config, scoped key metadata, or `b2_list_buckets`."""
        if self._config.bucket_id:
            return self._config.bucket_id
        from_allowed = bucket_id_from_allowed(storage_api, self._config.bucket_name)
        if from_allowed is not None:
            return from_allowed
        try:
            response = self._http.post(
                f"{api_url}{B2_API_PATH}/b2_list_buckets",
                headers={"Authorization": token},
                json={"accountId": account_id, "bucketName": self._config.bucket_name},
            )
        except httpx.HTTPError as exc:
            raise ExternalServiceError("Backblaze B2 bucket lookup failed") from exc
        if response.status_code == httpx.codes.OK:
            from_list = bucket_id_from_list(_response_json(response, "b2_list_buckets"), self._config.bucket_name)
            if from_list is not None:
                return from_list
        raise ExternalServiceError(f"Backblaze B2 bucket {self._config.bucket_name!r} could not be resolved")

    def _invalidate_session(self, stale: B2Session) -> None:
        """Clear cached auth and upload targets only if `stale` is still the current session."""
        with self._lock:
            if self._session == stale:
                self._session = None
                self._upload_targets.clear()

    def _acquire_upload_target(self) -> tuple[B2Session, UploadTarget]:
        """Pop an idle upload target for the active session, or fetch a new one via b2_get_upload_url."""
        session = self._authorize()
        with self._lock:
            if self._session == session and self._upload_targets:
                return session, self._upload_targets.pop()
        payload = self._post_api(f"{B2_API_PATH}/b2_get_upload_url", {"bucketId": session.bucket_id})
        assert payload is not None
        return self._authorize(), parse_upload_target(payload)

    def _release_upload_target(self, session: B2Session, target: UploadTarget) -> None:
        """Return a healthy upload target to the pool when it belongs to the current session."""
        with self._lock:
            if self._session == session and len(self._upload_targets) < MAX_CACHED_UPLOAD_TARGETS:
                self._upload_targets.append(target)

    def _post_api(self, path: str, body: dict[str, Any], *, allow_not_found: bool = False) -> dict[str, Any] | None:
        """POST JSON to a B2 storage API endpoint, refreshing the auth token on 401 and retrying transient errors."""
        for attempt in range(MAX_ATTEMPTS):
            session = self._authorize()
            try:
                response = self._http.post(
                    f"{session.api_url}{path}", headers={"Authorization": session.token}, json=body
                )
            except httpx.HTTPError as exc:
                if attempt + 1 < MAX_ATTEMPTS:
                    continue
                raise ExternalServiceError(f"Backblaze B2 {path} request failed") from exc
            if response.status_code == httpx.codes.OK:
                return _response_json(response, path)
            if allow_not_found and (
                response.status_code == httpx.codes.NOT_FOUND
                or (response.status_code == httpx.codes.BAD_REQUEST and _b2_error_code(response) == FILE_NOT_PRESENT)
            ):
                return None
            if response.status_code == httpx.codes.UNAUTHORIZED:
                self._invalidate_session(session)
                if attempt + 1 < MAX_ATTEMPTS:
                    continue
            elif response.status_code in RETRY_STATUSES and attempt + 1 < MAX_ATTEMPTS:
                continue
            raise ExternalServiceError(f"Backblaze B2 {path} failed ({response.status_code})")
        raise ExternalServiceError(f"Backblaze B2 {path} failed")

    def _list_versions(self, object_name: str) -> list[tuple[str, str]]:
        """List every `(fileName, fileId)` matching `object_name` exactly."""
        versions: list[tuple[str, str]] = []
        start_name: str | None = object_name
        start_id: str | None = None
        while start_name is not None:
            session = self._authorize()
            body: dict[str, Any] = {
                "bucketId": session.bucket_id,
                "startFileName": start_name,
                "prefix": object_name,
                "maxFileCount": LIST_MAX_COUNT,
            }
            if start_id is not None:
                body["startFileId"] = start_id
            listed = self._post_api(f"{B2_API_PATH}/b2_list_file_versions", body)
            assert listed is not None
            found, start_name, start_id = matching_versions(listed, object_name)
            versions.extend(found)
        return versions
