"""The security headers the backend adds to its responses (web layer, D193).

main.py adds SecurityHeadersMiddleware outside the error handling, so every response gets them, a 500 included.
The pages' own headers (their Content-Security-Policy) are the web server's (web/security-headers.ts); these cover
what the backend answers: the API, the MCP endpoint, /health and the docs pages.

- Everywhere: no type sniffing, no framing, no referrer to other sites; over HTTPS, HSTS.
- Under the data prefixes (the API and MCP): **never stored by a cache** (`Cache-Control: no-store`). The answers are
  one person's data, chosen by a cookie or a token: a shared cache that kept one could hand it to someone else. And a
  Content-Security-Policy that allows nothing: the answers are JSON and event streams, so if a browser ever showed
  one as a page, nothing in it could run. (The docs pages, /docs and /redoc, load scripts and are left without one.)

A header a route has already set is kept, except that `no-store` is added to a Cache-Control that lacks it (the
assistant's event stream sets `no-cache`, which alone would still let a cache keep a copy).
"""

from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send

# Two years: the usual HSTS lifetime for a site that serves HTTPS only.
HSTS_MAX_AGE_SECONDS = 63_072_000
HSTS = ("Strict-Transport-Security", f"max-age={HSTS_MAX_AGE_SECONDS}")
# On every response.
ALWAYS = (
    ("X-Content-Type-Options", "nosniff"),
    ("X-Frame-Options", "DENY"),
    ("Referrer-Policy", "same-origin"),
)
# On responses that carry a person's data: nothing in them may run, no other origin may embed them, and no cache keeps them.
PRIVATE_HEADERS = (
    ("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"),
    ("Cross-Origin-Resource-Policy", "same-origin"),
)
CACHE_CONTROL = "Cache-Control"
NO_STORE = "no-store"
RESPONSE_START = "http.response.start"


def _matches_prefix(path: str, prefixes: tuple[str, ...]) -> bool:
    """Whether `path` equals one of `prefixes` or lives under it (boundary-safe, so /api/v10 doesn't match /api/v1)."""
    return any(path == prefix or path.startswith(prefix + "/") for prefix in prefixes)


def _never_stored(headers: MutableHeaders) -> None:
    """Make sure the response's Cache-Control says no-store, keeping whatever else the route asked for."""
    current = headers.get(CACHE_CONTROL)
    if current is None:
        headers[CACHE_CONTROL] = NO_STORE
    elif NO_STORE not in current.lower():
        headers[CACHE_CONTROL] = f"{current}, {NO_STORE}"


class SecurityHeadersMiddleware:
    """ASGI middleware: adds the security headers to every HTTP response, and the private ones under the data
    prefixes."""

    def __init__(self, app: ASGIApp, data_prefixes: tuple[str, ...], https: bool) -> None:
        """Wrap `app`. `data_prefixes` are the paths whose answers are a person's data (the API's and MCP's); `https`
        says the app is served over HTTPS (PUBLIC_URL), so HSTS is sent."""
        self._app = app
        self._data_prefixes = tuple(prefix.rstrip("/") for prefix in data_prefixes)
        self._always = (*ALWAYS, HSTS) if https else ALWAYS

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Pass the request on, adding the headers as the response starts (those a route set itself are kept)."""
        if scope["type"] != "http":
            await self._app(scope, receive, send)
            return
        private = _matches_prefix(scope.get("path", ""), self._data_prefixes)

        async def send_with_headers(message: Message) -> None:
            """Forward each message; the one that starts the response gets the headers first."""
            if message["type"] == RESPONSE_START:
                headers = MutableHeaders(scope=message)
                for name, value in self._always:
                    headers.setdefault(name, value)
                if private:
                    for name, value in PRIVATE_HEADERS:
                        headers.setdefault(name, value)
                    _never_stored(headers)
            await send(message)

        await self._app(scope, receive, send_with_headers)
