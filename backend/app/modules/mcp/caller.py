"""Who an MCP request acts for: its caller, a person's user id, set by whatever received the request (D191).

Part of the mcp adapter. The tools and the "recent" resource read the caller here (current_caller), and only
ever touch that person's expenses. Three places set it, each from something the request itself can't forge:
- the HTTP endpoint (http.py), from the personal access token in the Authorization header;
- the stdio server (backend/mcp_stdio.py), from the token in its environment, for the whole process;
- the assistant (assistant/tools/mcp_adapter.py), for the person signed in to the web app, around each call.

Nothing in an MCP message (arguments, `_meta`) can name a caller. It's a context variable: asyncio tasks and
anyio's worker threads copy the context they start in, so the value set around a request reaches the tool
function that serves it, and two requests at once each see their own.
"""

from collections.abc import Callable, Iterator
from contextlib import contextmanager
from contextvars import ContextVar

from app.core.clock import DEFAULT_TIMEZONE
from app.core.errors import AuthenticationError
from app.core.identity import TokenCaller
from app.core.money import DEFAULT_USER_CURRENCY

CallerIdentity = int | TokenCaller
# Answers the caller's user id (or TokenCaller with account preferences), asked on every tool call: None once
# credentials stop working (the stdio server's token revoked or expired since it started).
CallerLookup = Callable[[], CallerIdentity | None]

# What an MCP client is told when no caller is set or its credentials stopped working (English: only MCP clients
# and the model read it).
NOT_SIGNED_IN = "This MCP connection isn't signed in, or its access token no longer works: use a valid token."

_caller: ContextVar[CallerLookup | None] = ContextVar("spendwise_mcp_caller", default=None)
_in_http_request: ContextVar[bool] = ContextVar("spendwise_mcp_in_http_request", default=False)
_process_resolver: CallerLookup | None = None


def _lookup_for(who: CallerIdentity | CallerLookup) -> CallerLookup:
    """A lookup for a fixed user id / TokenCaller, or the lookup itself."""
    if isinstance(who, (int, TokenCaller)):
        return lambda: who
    return who


@contextmanager
def acting_for(who: CallerIdentity | CallerLookup) -> Iterator[None]:
    """Serve the MCP requests started inside the block for `who`: a user id, TokenCaller, or a lookup.

    The previous caller (usually none) is back when the block ends, even if it raises.
    """
    token = _caller.set(_lookup_for(who))
    try:
        yield
    finally:
        _caller.reset(token)


@contextmanager
def act_for_request(who: CallerIdentity | CallerLookup | None) -> Iterator[None]:
    """Mark an HTTP request context for `who`, ensuring an unauthenticated HTTP request never falls back to
    `_process_resolver`."""
    http_token = _in_http_request.set(True)
    caller_token = _caller.set(_lookup_for(who) if who is not None else None)
    try:
        yield
    finally:
        _caller.reset(caller_token)
        _in_http_request.reset(http_token)


def act_for_process(lookup: CallerLookup) -> None:
    """Serve every MCP request of this process for whoever `lookup` names: for a server that runs for one person
    (stdio), set before it starts. `mcp run` imports the server and starts it later, so this can't be a block."""
    global _process_resolver
    _process_resolver = lookup
    _caller.set(lookup)


def _resolved_caller() -> CallerIdentity:
    """The resolved CallerIdentity (user id or TokenCaller), or AuthenticationError if missing/invalid."""
    lookup = _caller.get()
    if lookup is None and not _in_http_request.get():
        lookup = _process_resolver
    resolved = lookup() if lookup is not None else None
    if resolved is None:
        raise AuthenticationError(NOT_SIGNED_IN)
    return resolved


def current_caller() -> int:
    """The user id the current MCP request acts for.

    Raises AuthenticationError (an MCP tool error) if no caller is set, or its credentials no longer work: a tool
    never falls back to anyone's data.
    """
    resolved = _resolved_caller()
    return resolved if isinstance(resolved, int) else resolved.user_id


def current_timezone() -> str:
    """The IANA time zone name for the current MCP caller, defaulting to 'UTC'."""
    resolved = _resolved_caller()
    return DEFAULT_TIMEZONE if isinstance(resolved, int) else resolved.timezone


def current_currency() -> str:
    """The ISO 4217 default currency code for the current MCP caller."""
    resolved = _resolved_caller()
    return DEFAULT_USER_CURRENCY if isinstance(resolved, int) else resolved.default_currency
