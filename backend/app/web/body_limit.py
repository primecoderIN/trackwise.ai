"""Request-body size guard: stops oversized uploads before FastAPI/multipart spools them to disk (web layer).

main.py installs BodySizeLimitMiddleware inside SecurityHeadersMiddleware so a 413 problem response still receives
security and no-store headers, and rejects multi-GB multipart uploads before python-multipart writes temporary files.
"""

from collections.abc import Mapping

from starlette.datastructures import Headers
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.i18n import text
from app.web.dependencies import language_of
from app.web.i18n import WebText
from app.web.problems import HTTP_SLUG, problem_response

# HTTP 413 Payload Too Large title (English; detail is catalogued in the request's language).
PAYLOAD_TOO_LARGE_STATUS = 413
PAYLOAD_TOO_LARGE_TITLE = "Payload Too Large"


class _BodyTooLarge(Exception):
    """Internal signal raised when streamed request bytes exceed the configured limit."""


class BodySizeLimitMiddleware:
    """ASGI middleware: limits request body bytes for configured path prefixes (both Content-Length and streamed)."""

    def __init__(self, app: ASGIApp, limits: Mapping[str, int]) -> None:
        """Wrap `app`; `limits` maps URL path prefixes (e.g. '/api/v1/receipts') to their max byte sizes."""
        self._app = app
        self._limits = tuple((prefix.rstrip("/"), limit) for prefix, limit in limits.items())

    def _limit_for(self, path: str) -> int | None:
        """The max body size configured for `path`, or None if unrestricted here."""
        for prefix, limit in self._limits:
            if path == prefix or path.startswith(prefix + "/"):
                return limit
        return None

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Reject requests whose Content-Length or streamed body exceeds the path's limit with a 413 problem."""
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return
        path = scope.get("path", "")
        limit = self._limit_for(path)
        if limit is None:
            await self._app(scope, receive, send)
            return
        headers = Headers(scope=scope)
        raw_length = headers.get("content-length")
        if raw_length is not None and raw_length.isascii() and raw_length.isdigit() and int(raw_length) > limit:
            await self._reject(scope, receive, send, headers, path)
            return

        seen = 0
        started = False

        async def bounded_receive() -> Message:
            """Count incoming body bytes and abort before multipart spooling exceeds `limit`."""
            nonlocal seen
            message = await receive()
            if message["type"] == "http.request":
                seen += len(message.get("body", b""))
                if seen > limit:
                    raise _BodyTooLarge
            return message

        async def tracking_send(message: Message) -> None:
            """Record when response headers have been sent so we never write a second response."""
            nonlocal started
            started = started or message["type"] == "http.response.start"
            await send(message)

        try:
            await self._app(scope, bounded_receive, tracking_send)
        except _BodyTooLarge:
            if not started:
                await self._reject(scope, receive, send, headers, path)

    async def _reject(self, scope: Scope, receive: Receive, send: Send, headers: Headers, path: str) -> None:
        """Send a localized RFC 9457 413 Payload Too Large problem response."""
        detail = text(language_of(headers), WebText.PAYLOAD_TOO_LARGE)
        response = problem_response(PAYLOAD_TOO_LARGE_STATUS, HTTP_SLUG, PAYLOAD_TOO_LARGE_TITLE, detail, path)
        await response(scope, receive, send)
