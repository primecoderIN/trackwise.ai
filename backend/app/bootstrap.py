"""The composition root: the one place that knows every module and every adapter, and wires them together.

main.py (the web app), seed.py, mcp_stdio.py and the migrations (for the tables) all build the app from here,
so there's exactly one list of modules, and nothing registers itself as a side effect of being imported.

build() is also the one seam for replacing the outside world: pass it a clock, a language model, expense tools, a
database engine, a file store, an identity provider, a sealer or the remote agents, and everything built from the result
(the bus, the MCP server, the session check, the routes, main.create_app(services)) uses those instead of the real ones.
"""

from collections.abc import Callable
from dataclasses import dataclass

from fastapi import APIRouter
from mcp.server.mcpserver import MCPServer
from sqlalchemy import Engine, MetaData
from sqlmodel import SQLModel

from app import agents_host
from app.core.agents import RemoteAgents
from app.core.clock import Clock, SystemClock
from app.core.cqrs import MessageBus
from app.core.files import FileStore
from app.core.identity import IdentityProvider
from app.core.llm import LanguageModel
from app.core.rate_limit import RateLimiter
from app.core.sealing import Sealer
from app.core.skills import SkillLibrary
from app.infrastructure import db
from app.infrastructure.config import API_PREFIX, Settings, get_settings
from app.infrastructure.files import UnconfiguredFileStore
from app.infrastructure.identity import ClientCredentials, OidcIdentityProvider, UnconfiguredIdentityProvider
from app.infrastructure.llm.gemini import GeminiModel
from app.infrastructure.sealing import FernetSealer
from app.infrastructure.skills import FolderSkillLibrary
from app.infrastructure.storage.b2 import B2FileStore
from app.infrastructure.storage.b2_wire import B2Config
from app.modules import accounts, budgets, expenses, reports
from app.modules.accounts import module as accounts_module
from app.modules.assistant import module as assistant_module
from app.modules.budgets import module as budgets_module
from app.modules.categories import module as categories_module
from app.modules.conversations import module as conversations_module
from app.modules.expenses import module as expenses_module
from app.modules.mcp import module as mcp_module
from app.modules.receipts import module as receipts_module
from app.modules.reports import module as reports_module
from app.web.auth import SessionCookies

HTTPS_SCHEME = "https://"
# Rate limits for non-model routes (per person for reports/receipts/MCP, per client IP for sign-in routes).
REPORT_REQUESTS_PER_MINUTE = 20
REPORT_REQUESTS_PER_DAY = 200
RECEIPT_REQUESTS_PER_MINUTE = 15
RECEIPT_REQUESTS_PER_DAY = 150
AUTH_REQUESTS_PER_MINUTE = 30
AUTH_REQUESTS_PER_DAY = 300
MCP_REQUESTS_PER_MINUTE = 60
MCP_REQUESTS_PER_DAY = 2000

# Every module with handlers or tables. (The mcp module has neither: it's an adapter over the bus. Nor has the reports
# module: it reads through other modules' queries.)
MODULES = (
    accounts_module,
    categories_module,
    expenses_module,
    budgets_module,
    conversations_module,
    receipts_module,
    assistant_module,
)


@dataclass(frozen=True)
class Services:
    """Everything the app is made of, built once by build() and shared by every entry point."""

    clock: Clock
    # The database: the bus's sessions, /health and the start-up migration check all use this engine.
    engine: Engine
    bus: MessageBus
    llm: LanguageModel
    # The assistant's expense tools (the assistant's ExpenseTools port).
    tools: assistant_module.ExpenseTools
    # Where uploaded files' bytes are kept (the receipts module's receipts).
    files: FileStore
    # The A2A agents (agents/: receipt, insights, currency), hosted in this process (D207), behind the RemoteAgents
    # port (D201): the assistant reads receipts and delegates, and the expenses recorder gets rates, through them.
    agents: RemoteAgents
    # Saves expenses, converting an amount in another currency to base currency first (D204, D223): shared by REST
    # and MCP.
    recorder: expenses.ExpenseRecorder
    # Monthly reports (D209): the REST routes and MCP's get_monthly_report share it.
    reports: reports.MonthlyReports
    # Which budgets a save pushes near or over their limit (D212): the expenses routes' SaveWatcher, the MCP save
    # tools'.
    budget_watch: budgets.BudgetWatch
    # The Agent Skills the assistant may read (D208): SKILL.md folders, by default the project's skills/.
    skills: SkillLibrary
    mcp_server: MCPServer
    # Personal access tokens (D191): the account routes make them; MCP over HTTP and the stdio server resolve one to
    # the person it acts for.
    access_tokens: accounts_module.AccessTokens
    # The rate limit on the routes that call the language model (D194), per person, plus limits on report, receipt,
    # sign-in and MCP routes.
    model_quota: RateLimiter
    report_quota: RateLimiter
    receipt_quota: RateLimiter
    auth_quota: RateLimiter
    mcp_quota: RateLimiter
    # The web app's origin (settings.public_url) and whether it uses HTTPS.
    public_url: str
    https: bool
    # Sign-in (Phase 22): the identity provider (its issuer is None when sign-in isn't configured), the sealer for
    # the ID tokens sessions keep, the session check main.py puts in front of the protected routes, how the cookies
    # are written, and the addresses the provider is given.
    identity: IdentityProvider
    sealer: Sealer
    sessions: accounts_module.SessionGate
    cookies: SessionCookies
    sign_in: accounts_module.SignInConfig

    def close(self) -> None:
        """Close any background loops, HTTP clients and database pools owned by these services."""
        for resource in (self.agents, self.tools, self.llm, self.files):
            closer = getattr(resource, "close", None)
            if callable(closer):
                closer()
        self.engine.dispose()


def build_bus(clock: Clock, engine: Engine) -> MessageBus:
    """The one MessageBus, opening its sessions on `engine`, with every module's handlers registered.

    Raises ValueError if two modules register the same message (a wiring mistake).
    """
    bus = MessageBus(db.session_factory(engine), clock)
    for module in MODULES:
        module.register_handlers(bus)
    return bus


def build(
    clock: Clock | None = None,
    llm: LanguageModel | None = None,
    tools: assistant_module.ExpenseTools | None = None,
    engine: Engine | None = None,
    files: FileStore | None = None,
    identity: IdentityProvider | None = None,
    sealer: Sealer | None = None,
    agents: RemoteAgents | None = None,
    skills: SkillLibrary | None = None,
    settings: Settings | None = None,
) -> Services:
    """Everything the app is made of. Each argument left out gets the real one, configured from the settings.

    - clock: the system clock;
    - llm: Gemini, with GEMINI_API_KEY and GEMINI_MODEL (checked on the first model call, not here);
    - tools: this app's own MCP server, called in-process (acting, on each run, for the person signed in);
    - engine: the database in DATABASE_URL (infrastructure/db.default_engine());
    - files: the configured FileStore adapter (selected via STORAGE_PROVIDER), or UnconfiguredFileStore when
      required storage settings are missing (fail-closed). A check that uses a copy of the database should pass
      its own too, so uploads don't land in real storage;
    - identity: the OpenID Connect provider in OIDC_ISSUER (nothing is fetched from it until someone signs in), or,
      if a sign-in setting is missing, one that refuses every sign-in (D185);
    - sealer: Fernet, with SESSION_ENCRYPTION_KEYS;
    - agents: the receipt, insights and currency agents, hosted in this process and reached in memory
      (agents_host.py, D207), using `llm` and `clock`. A check passes a fake RemoteAgents, or its own A2AAgents.
    """
    clock = SystemClock() if clock is None else clock
    settings = get_settings() if settings is None else settings
    engine = db.default_engine() if engine is None else engine
    skills = FolderSkillLibrary(settings.skills_dir) if skills is None else skills
    bus = build_bus(clock, engine)
    if llm is None:
        # The one place that picks the LLM provider: Gemini, behind the LanguageModel port.
        llm = GeminiModel(settings.gemini_api_key, settings.gemini_model)
    # The agents run inside this process, with the same model (D207); the multi-server branch reaches them as services.
    agents = agents_host.hosted_agents(llm, clock) if agents is None else agents
    recorder = expenses_module.create_recorder(bus, agents)
    # The monthly reports: the monthly-report skill's script works the figures out, run by the server (D209).
    monthly_reports = reports_module.create_reports(bus, skills, clock)
    # Which budgets a save pushes near or over their limit: the REST save routes' notices, the MCP tools' alerts (D212).
    budget_watch = budgets_module.create_watch(bus)
    mcp_server = mcp_module.create_server(bus, recorder, monthly_reports, clock, budget_watch)
    if tools is None:
        # The assistant's tools: this app's own MCP server, in-process. Each run binds them to the signed-in person.
        tools = assistant_module.McpExpenseTools(mcp_server)
    files = _file_store(settings) if files is None else files
    identity = _identity_provider(settings, clock) if identity is None else identity
    if sealer is None:
        sealer = FernetSealer([key.get_secret_value() for key in settings.session_encryption_keys])
    return Services(
        clock=clock,
        engine=engine,
        bus=bus,
        llm=llm,
        tools=tools,
        files=files,
        agents=agents,
        recorder=recorder,
        reports=monthly_reports,
        budget_watch=budget_watch,
        skills=skills,
        mcp_server=mcp_server,
        access_tokens=accounts_module.create_access_tokens(bus, clock, identity=identity),
        model_quota=RateLimiter(clock, settings.model_requests_per_minute, settings.model_requests_per_day),
        report_quota=RateLimiter(clock, REPORT_REQUESTS_PER_MINUTE, REPORT_REQUESTS_PER_DAY),
        receipt_quota=RateLimiter(clock, RECEIPT_REQUESTS_PER_MINUTE, RECEIPT_REQUESTS_PER_DAY),
        auth_quota=RateLimiter(clock, AUTH_REQUESTS_PER_MINUTE, AUTH_REQUESTS_PER_DAY),
        mcp_quota=RateLimiter(clock, MCP_REQUESTS_PER_MINUTE, MCP_REQUESTS_PER_DAY),
        public_url=settings.public_url,
        https=settings.public_url.startswith(HTTPS_SCHEME),
        identity=identity,
        sealer=sealer,
        sessions=accounts_module.create_session_gate(bus, identity, clock),
        cookies=_session_cookies(settings),
        sign_in=_sign_in_config(settings),
    )


def _session_cookies(settings: Settings) -> SessionCookies:
    """How the session and login cookies are written: Secure (COOKIE_SECURE), and as long-lived as the session and
    the sign-in attempt they stand for (the server ends either sooner when it must)."""
    return SessionCookies(
        secure=settings.cookie_secure,
        session_max_age=int(accounts.SESSION_LIFETIME.total_seconds()),
        login_max_age=int(accounts.LOGIN_ATTEMPT_TTL.total_seconds()),
    )


def _sign_in_config(settings: Settings) -> accounts_module.SignInConfig:
    """The addresses the provider is given, all on PUBLIC_URL (the origin people open the web app at, D184), and the
    role sign-in requires."""
    return accounts_module.SignInConfig(
        redirect_uri=settings.public_url + API_PREFIX + accounts.CALLBACK_PATH,
        signed_out_url=settings.public_url + accounts.SIGN_IN_PAGE,
        required_role=settings.oidc_required_role,
    )


def _b2_file_store(settings: Settings) -> FileStore:
    """Build B2FileStore from validated Backblaze B2 settings, or UnconfiguredFileStore if unset."""
    missing = settings.missing_for_b2()
    if missing or settings.b2_key_id is None or settings.b2_application_key is None or settings.b2_bucket_name is None:
        return UnconfiguredFileStore(missing)
    return B2FileStore(
        B2Config(
            key_id=settings.b2_key_id,
            application_key=settings.b2_application_key.get_secret_value(),
            bucket_name=settings.b2_bucket_name,
            bucket_id=settings.b2_bucket_id,
            prefix=settings.b2_prefix,
        )
    )


# Registry of file-storage adapters by STORAGE_PROVIDER; adding another backend adds one entry here.
_FILE_STORES: dict[str, Callable[[Settings], FileStore]] = {"b2": _b2_file_store}


def _file_store(settings: Settings) -> FileStore:
    """The one place that picks the receipt FileStore adapter for `settings.storage_provider`."""
    builder = _FILE_STORES.get(settings.storage_provider)
    if builder is None:
        raise ValueError(f"Unsupported STORAGE_PROVIDER: {settings.storage_provider!r}")
    return builder(settings)


def _identity_provider(settings: Settings, clock: Clock) -> IdentityProvider:
    """The one place that picks the sign-in adapter: standard OpenID Connect, configured from the OIDC_* settings, or,
    while one of them (or SESSION_ENCRYPTION_KEYS) is missing, one that refuses every sign-in (fail closed)."""
    missing = settings.missing_for_sign_in()
    issuer, client_id, secret = settings.oidc_issuer, settings.oidc_client_id, settings.oidc_client_secret
    if missing or issuer is None or client_id is None or secret is None:
        return UnconfiguredIdentityProvider(missing)
    return OidcIdentityProvider(
        issuer,
        ClientCredentials(client_id, secret.get_secret_value()),
        clock,
        scopes=settings.oidc_scopes.split(),
        options=settings.oidc_login_options,
        role_claim=settings.oidc_role_claim,
    )


def auth_routers(services: Services) -> list[APIRouter]:
    """The sign-in routes (the accounts module's). main.py mounts them without the session check: they're how a
    session starts and ends."""
    return [accounts_module.create_router(services.bus, services.identity, services.sealer, services.sign_in)]


def api_routers(services: Services) -> list[APIRouter]:
    """Every other module's REST routes; main.py puts the X-CSRF and session checks in front of all of them. Their
    order is the OpenAPI document's order.

    The expenses, receipts, reports and assistant routers are built from `services` (the recorder, the file store, the
    monthly reports, the tools, the model and the remote agents): the expenses routes save through the recorder, the
    receipts routes take uploads, the reports routes answer with the monthly reports, and
    the assistant hands an attached receipt's file (ReceiptFiles, for its owner only) to the receipt agent. The account
    router (the signed-in person's sessions and access tokens) gets the bus, the provider and the tokens. The others are
    fixed routers that read the bus and the clock from `app.state` at request time (web/dependencies), which create_app
    sets from the same services.
    """
    receipt_files = receipts_module.create_files(services.bus, services.files)
    return [
        categories_module.router,
        expenses_module.create_router(services.recorder, services.budget_watch),
        budgets_module.router,
        conversations_module.router,
        receipts_module.create_router(services.bus, services.files),
        reports_module.create_router(services.reports),
        assistant_module.create_router(
            services.bus, services.tools, services.llm, receipt_files, services.agents, services.clock, services.skills
        ),
        accounts_module.create_account_router(services.bus, services.identity, services.access_tokens),
    ]


def metadata() -> MetaData:
    """Every module's tables, for the migrations (backend/migrations/env.py).

    Raises RuntimeError if a module's table isn't registered on SQLModel's shared metadata (then the
    migrations wouldn't see it).
    """
    tables = [table for module in MODULES for table in module.TABLES]
    if not all(table.__table__.metadata is SQLModel.metadata for table in tables):
        raise RuntimeError("Every module table must share SQLModel.metadata")
    return SQLModel.metadata
