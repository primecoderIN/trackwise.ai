"""The web app: FastAPI, built from the composition root (bootstrap.py) (entry point, HTTP adapter).

create_app() puts together the error handling (RFC 9457 problem details), /health, the sign-in routes, every other
module's routes under API_PREFIX behind the X-CSRF and session checks (D186), and the MCP server at MCP_PATH, behind
personal access tokens (D191). uvicorn serves `app` (`.\\run.ps1`), and the export script reads its OpenAPI document.
create_app(services) builds the same app around services made elsewhere, e.g. bootstrap.build() with a fake model,
a fake identity provider or another database.

There's no CORS (D184): the web app reaches the API on its own origin, through Next.js's rewrite or a reverse proxy,
so no other website is ever allowed to read these responses in a browser.
"""

import logging
from collections.abc import AsyncIterator, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import Engine, text
from sqlalchemy.exc import SQLAlchemyError

from app import bootstrap
from app.agents_host import AGENT_LOGGERS
from app.bootstrap import Services
from app.infrastructure import migrations
from app.infrastructure.config import API_PREFIX, API_VERSION, MCP_PATH
from app.infrastructure.logging import setup_logging
from app.modules.mcp import module as mcp_module
from app.modules.receipts import MAX_RECEIPT_BYTES
from app.web.auth import require_csrf, require_user
from app.web.body_limit import BodySizeLimitMiddleware
from app.web.problems import UnexpectedErrorMiddleware, register_error_handlers
from app.web.security_headers import SecurityHeadersMiddleware

logger = logging.getLogger(__name__)

HEALTHY = {"status": "ok"}
UNHEALTHY = {"status": "unavailable"}
NO_STORE_HEADERS = {"Cache-Control": "no-store"}
# Receipts allow up to 5 MB plus multipart framing; other API routes cap request bodies at 2 MB.
RECEIPT_UPLOAD_PREFIX = f"{API_PREFIX}/receipts"
RECEIPT_REQUEST_LIMIT = MAX_RECEIPT_BYTES + 256 * 1024
DEFAULT_REQUEST_LIMIT = 2 * 1024 * 1024
# What every module's routes need, sign-in's aside: a request the app itself sent (X-CSRF), then a live session.
# The cheap header check runs first, so a forged request never reaches the database.
PROTECTED = [Depends(require_csrf), Depends(require_user)]

Lifespan = Callable[[FastAPI], AbstractAsyncContextManager[None]]


def create_app(services: Services | None = None) -> FastAPI:
    """The whole web app, around `services` (by default, bootstrap.build(): the real adapters and database)."""
    if services is None:
        # The agents run in this process (D207): their loggers are shown with the backend's.
        setup_logging(loggers=AGENT_LOGGERS)
    built = bootstrap.build() if services is None else services
    # MCP over HTTP: every request needs a personal access token, and acts only for its owner (D191).
    mcp_http_app = mcp_module.create_http_app(
        built.mcp_server,
        built.access_tokens.resolve_caller,
        public_url=built.public_url,
        rate_limiter=built.mcp_quota,
    )

    app = FastAPI(
        title="trackwise.ai API", version=API_VERSION, lifespan=_lifespan(built, close_on_exit=services is None)
    )
    # Shared services for routes (web/dependencies.py, web/auth.py): one bus and one clock for the whole app, the
    # session check (the accounts module's) and how the cookies are written.
    app.state.bus = built.bus
    app.state.clock = built.clock
    app.state.authenticate = built.sessions.authenticate
    app.state.cookies = built.cookies
    # Per-person and per-IP rate limits (web/rate_limits.py).
    app.state.model_quota = built.model_quota
    app.state.report_quota = built.report_quota
    app.state.receipt_quota = built.receipt_quota
    app.state.auth_quota = built.auth_quota
    if built.identity.issuer is None:
        logger.warning("Sign-in isn't configured, so nobody can sign in: every API route answers 401 (see OIDC_*).")
    if not getattr(built.files, "configured", True):
        logger.warning("Receipt file storage isn't configured, so receipt uploads and reads will fail.")
    _add_error_handling(app, https=built.https)
    # Registered before the modules' routes, so the OpenAPI document keeps /health first.
    _add_health_check(app, built.engine)
    for router in bootstrap.auth_routers(built):
        app.include_router(router, prefix=API_PREFIX)
    for router in bootstrap.api_routers(built):
        app.include_router(router, prefix=API_PREFIX, dependencies=PROTECTED)
    # MCP clients connect to http://127.0.0.1:8000/mcp/ with "Authorization: Bearer <personal access token>".
    app.mount(MCP_PATH, mcp_http_app)
    return app


def _lifespan(services: Services, *, close_on_exit: bool = False) -> Lifespan:
    """The app's start-up and shutdown: check the migrations, and run the MCP session manager."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        """Runs once at startup, before the first request is accepted; the code after `yield` at shutdown.

        Raises RuntimeError (the app doesn't start) if the database isn't at the latest migration.
        """
        migrations.require_latest(services.engine)
        try:
            # A mounted app's own startup code doesn't run, so start the MCP session manager here.
            async with services.mcp_server.session_manager.run():
                yield
        finally:
            if close_on_exit:
                services.close()

    return lifespan


def _add_error_handling(app: FastAPI, *, https: bool) -> None:
    """Turn every error, including a bug's, into a problem-details response, enforce body limits, and give every
    response its security headers."""
    register_error_handlers(app)
    app.add_middleware(
        BodySizeLimitMiddleware,
        limits={RECEIPT_UPLOAD_PREFIX: RECEIPT_REQUEST_LIMIT, API_PREFIX: DEFAULT_REQUEST_LIMIT},
    )
    # Closest to the routes (outside the body limit): anything added later wraps it and sees an ordinary
    # 500 problem, never the exception.
    app.add_middleware(UnexpectedErrorMiddleware)
    # Outside it, so a 413 or 500 gets the headers too. The API's and MCP's answers are a person's data:
    # never cached (D193).
    app.add_middleware(
        SecurityHeadersMiddleware,
        data_prefixes=(API_PREFIX, MCP_PATH),
        https=https,
    )


def _add_health_check(app: FastAPI, engine: Engine) -> None:
    """Add GET /health, which answers HEALTHY once it reaches the database through `engine` (or 503 if unreachable)."""

    # A route: FastAPI would copy a docstring into the OpenAPI document, so notes go in comments.
    # Cheap enough to call often: checks the server is up and can reach its database.
    @app.get("/health", response_model=dict[str, str])
    def health() -> JSONResponse:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
        except SQLAlchemyError as exc:
            logger.warning("Database health check failed: %s", exc.__class__.__name__)
            return JSONResponse(UNHEALTHY, status_code=503, headers=NO_STORE_HEADERS)
        return JSONResponse(HEALTHY, headers=NO_STORE_HEADERS)
