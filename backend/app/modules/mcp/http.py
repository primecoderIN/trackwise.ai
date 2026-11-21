"""MCP over HTTP ("Streamable HTTP"), for MCP clients that connect by URL.

Two locks on the door:
- **DNS-rebinding protection** (the SDK's default for a server on 127.0.0.1): requests whose Host or
  Origin header isn't a local address are refused, so a web page can't reach the tools through the
  user's browser.
- **A personal access token** (below): every request must carry "Authorization: Bearer <token>", a token someone
  created in SpendWise's Settings. The request then acts for that person, and only them (caller.py, D191).

Part of the mcp adapter, reached through module.py: main.py mounts create_http_app's result at /mcp/. A missing,
wrong, expired or revoked token gets a 401 problem-details response (web/problems.py).
"""

from collections.abc import Callable
from urllib.parse import urlparse

import anyio.to_thread
from mcp.server.mcpserver import MCPServer
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import ForbiddenError, TooManyRequestsError
from app.core.rate_limit import RateLimiter
from app.modules.mcp.caller import act_for_request
from app.modules.mcp.contracts import AUTHORIZATION_HEADER, BEARER_SCHEME
from app.web.problems import HTTP_SLUG, RETRY_AFTER, UNAUTHORIZED_SLUG, problem_response

# Turns a token, as sent, into the user id of the person it belongs to; None if it doesn't work (unknown, expired,
# revoked, or its owner switched off). The accounts module's, handed in by the composition root.
TokenResolver = Callable[[str], int | None]

# ASGI gives header names in lower case, as bytes.
AUTHORIZATION = AUTHORIZATION_HEADER.lower().encode()
ORIGIN = b"origin"
CONTENT_LENGTH = b"content-length"
CACHE_CONTROL = "Cache-Control"
NO_STORE = "no-store"
BEARER = BEARER_SCHEME.lower()  # compared case-insensitively, see _token_in
UNAUTHORIZED_TITLE = "Unauthorized"
PAYLOAD_TOO_LARGE_TITLE = "Payload too large"
PAYLOAD_TOO_LARGE_DETAIL = "The MCP request body exceeds the maximum allowed size."
FORBIDDEN_ORIGIN_DETAIL = "The request's Origin is not allowed to reach the MCP endpoint."
RATE_LIMITED_DETAIL = "Too many MCP requests; wait and try again."
WWW_AUTHENTICATE = "WWW-Authenticate"  # tells a client which scheme to use (RFC 9110 §11.6.1)
UNAUTHORIZED_DETAIL = (
    f"Send a personal access token as '{AUTHORIZATION_HEADER}: {BEARER_SCHEME} <token>' "
    "(create one in SpendWise's Settings)."
)
MAX_MCP_BODY_BYTES = 256 * 1024
LOCAL_HOSTS = ("localhost", "127.0.0.1")


class _PayloadTooLarge(Exception):
    """Raised when an incoming MCP HTTP body exceeds MAX_MCP_BODY_BYTES."""


def _token_in(header: bytes) -> str | None:
    """The token of an Authorization header's "Bearer <token>" value, or None for any other value."""
    # "Bearer" is case-insensitive (RFC 9110 §11.1): "bearer abc" is as valid as "Bearer abc".
    scheme, _, token = header.decode("latin-1").partition(" ")
    token = token.strip()
    return token if scheme.lower() == BEARER and token else None


def _origin_allowed(origin_bytes: bytes | None, public_url: str | None) -> bool:
    """Whether `origin_bytes` is absent, matches `public_url`'s origin, or is a local http://localhost or
    http://127.0.0.1 origin (for the local MCP Inspector)."""
    if not origin_bytes or not public_url:
        return True
    origin = origin_bytes.decode("latin-1").strip().rstrip("/")
    parsed = urlparse(origin)
    if not parsed.scheme or not parsed.netloc:
        return False
    pub = urlparse(public_url.strip().rstrip("/"))
    if parsed.scheme == pub.scheme and parsed.netloc == pub.netloc:
        return True
    return parsed.scheme == "http" and parsed.hostname in LOCAL_HOSTS


class AccessTokenAuth:
    """ASGI middleware: validate Origin, body size, personal access token and rate limit, and serve the request for
    the token's owner with Cache-Control: no-store."""

    def __init__(
        self,
        app: ASGIApp,
        resolve: TokenResolver,
        *,
        public_url: str | None = None,
        rate_limiter: RateLimiter | None = None,
    ) -> None:
        """Wrap `app` (the MCP endpoint); `resolve` names the person a token belongs to."""
        self._app = app
        self._resolve = resolve
        self._public_url = public_url
        self._rate_limiter = rate_limiter

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Serve an HTTP request for its token's owner, or answer 401/403/413/429."""
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return

        async def send_no_store(message: Message) -> None:
            """Ensure every response from the MCP gate carries Cache-Control: no-store."""
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                current = headers.get(CACHE_CONTROL)
                if current is None:
                    headers[CACHE_CONTROL] = NO_STORE
                elif NO_STORE not in current.lower():
                    headers[CACHE_CONTROL] = f"{current}, {NO_STORE}"
            await send(message)

        raw_headers = dict(scope["headers"])
        path = scope.get("path", "")
        if not _origin_allowed(raw_headers.get(ORIGIN), self._public_url):
            response = problem_response(403, ForbiddenError.slug, ForbiddenError.title, FORBIDDEN_ORIGIN_DETAIL, path)
            await response(scope, receive, send_no_store)
            return

        content_length = raw_headers.get(CONTENT_LENGTH)
        if content_length is not None:
            try:
                if int(content_length.decode("latin-1").strip()) > MAX_MCP_BODY_BYTES:
                    response = problem_response(413, HTTP_SLUG, PAYLOAD_TOO_LARGE_TITLE, PAYLOAD_TOO_LARGE_DETAIL, path)
                    await response(scope, receive, send_no_store)
                    return
            except ValueError:
                pass

        token = _token_in(raw_headers.get(AUTHORIZATION, b""))
        # The lookup reads the database: in a worker thread, so the event loop isn't held up. Only the token's hash
        # is compared (the accounts module stores nothing else), so its timing reveals nothing about the token.
        owner = await anyio.to_thread.run_sync(self._resolve, token) if token else None
        if owner is None:
            response = problem_response(
                401,
                UNAUTHORIZED_SLUG,
                UNAUTHORIZED_TITLE,
                UNAUTHORIZED_DETAIL,
                path,
                headers={WWW_AUTHENTICATE: BEARER_SCHEME},
            )
            await response(scope, receive, send_no_store)
            return

        if self._rate_limiter is not None and scope.get("method", "").upper() == "POST":
            refusal = self._rate_limiter.take(owner)
            if refusal is not None:
                response = problem_response(
                    429,
                    TooManyRequestsError.slug,
                    TooManyRequestsError.title,
                    RATE_LIMITED_DETAIL,
                    path,
                    headers={RETRY_AFTER: str(refusal.retry_after_seconds)},
                )
                await response(scope, receive, send_no_store)
                return

        seen_bytes = 0
        started = False

        async def tracking_send(message: Message) -> None:
            nonlocal started
            if message["type"] == "http.response.start":
                started = True
            await send_no_store(message)

        async def limited_receive() -> Message:
            nonlocal seen_bytes
            message = await receive()
            if message["type"] == "http.request":
                seen_bytes += len(message.get("body", b""))
                if seen_bytes > MAX_MCP_BODY_BYTES:
                    raise _PayloadTooLarge
            return message

        # Everything the SDK starts for this request (its tasks, the tool's worker thread) copies this context, so
        # the tools see this owner, and only for this request.
        with act_for_request(owner):
            try:
                await self._app(scope, limited_receive, tracking_send)
            except BaseException as exc:
                if not started and _has_payload_too_large(exc):
                    response = problem_response(413, HTTP_SLUG, PAYLOAD_TOO_LARGE_TITLE, PAYLOAD_TOO_LARGE_DETAIL, path)
                    await response(scope, receive, send_no_store)
                    return
                raise


def _has_payload_too_large(exc: BaseException) -> bool:
    """Whether `exc` is or wraps `_PayloadTooLarge` (including inside an ExceptionGroup)."""
    if isinstance(exc, _PayloadTooLarge):
        return True
    if isinstance(exc, BaseExceptionGroup):
        return any(_has_payload_too_large(sub) for sub in exc.exceptions)
    return False


PersonalTokenGate = AccessTokenAuth


def create_http_app(
    server: MCPServer,
    resolve: TokenResolver,
    *,
    public_url: str | None = None,
    rate_limiter: RateLimiter | None = None,
) -> ASGIApp:
    """The server's Streamable HTTP endpoint behind the access-token check, ready to mount at /mcp/."""
    # stateless + JSON responses: each MCP request is answered on its own, with no per-client
    # session kept in memory, which is all our simple request/response tools need.
    inner = server.streamable_http_app(streamable_http_path="/", stateless_http=True, json_response=True)
    return AccessTokenAuth(inner, resolve, public_url=public_url, rate_limiter=rate_limiter)
