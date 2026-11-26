# Architecture Decision Records (ADRs)

Key engineering decisions for **trackwise.ai**, organized by architectural concern. Early baseline decisions (`D1–D138`) are summarized first, followed by detailed records (`D139–D221`) governing the modular monolith, CQRS bus, AI protocols, security posture, and Next.js web application.

> Append new decisions with the next `D<n>` ID. When a newer choice refines or replaces an earlier one, annotate the earlier entry with **Updated by** or **Superseded by** rather than deleting history.

---

## Foundational Baseline (`D1–D138`)

Early phases established the core stack, storage primitives, and initial UI/AI workflow:

| ID | Decision | Rationale & Status |
|---|---|---|
| **D1** | **Project-isolated Python environment (`.venv`) + pinned dependencies** | Keeps runtime (`requirements.txt`) and dev checks (`requirements-dev.txt`) reproducible and isolated per workspace. |
| **D12** | **Modular Monolith (`backend/app/modules/`)** | Delivers strict domain isolation without premature microservice operational overhead; MCP sits cleanly as `/mcp`, while A2A agents are isolated behind ports (**Updated by D175, D207**). |
| **D13** | **Zero cross-module SQL foreign keys** | Preserves module autonomy; cross-module IDs (such as `category_id` and `owner_id`) are validated through the owning module's public queries. |
| **D32** | **`GET /summary` reports one month in one normalized currency** | Summing mixed currencies is meaningless (**Updated by D204**: every expense now stores server-converted INR `base_amount_minor`). |
| **D64** | **No automated test suite committed in-repo; seams-first testability** | Owner manages automated tests separately; code stays strictly DI-driven so tests require zero monkeypatching (**Extended by D173**). |
| **D130** | **Only destructive actions (`delete_expense`) require confirmation** | Reads have no side effects and adds/edits are immediately visible and reversible; deletes trigger a human-in-the-loop approval card (**Extended by D145, D146**). |

---

## 1. Domain Architecture, CQRS & Persistence (`D139–D177`, `D215–D216`)

### D139. CQRS-lite via a single `MessageBus` and Unit of Work
- **Choice:** Every domain operation is a frozen Pydantic **Command** (mutates state, returns at most an ID) or **Query** (read-only), dispatched via `MessageBus` (`core/cqrs.py`), which owns the database transaction boundary.
- **Why:** Eliminates hidden commits in repositories, enforces read/write separation (nested `bus.ask()` inside commands switches to `writable=False`), and makes every use case easy to trace and compose.

### D140. Module registration via `module.py` and composition root `bootstrap.py`
- **Choice:** Modules expose public cross-module contracts in `__init__.py` and wire routes/handlers/tables in `module.py`. `app/bootstrap.py` builds the dependency graph explicitly; nothing builds state at import time (**Updated by D213**).
- **Why:** Prevents circular imports, avoids invisible decorator-registration bugs, and keeps ASGI startup (`uvicorn --factory`) deterministic.

### D141. Provider-neutral `conversations` module (`conversation_message`)
- **Choice:** Conversation turns live in their own module using internal message types (`UserText`, `AssistantText`, `ToolUse`, `ToolResult`), never raw Gemini/AG-UI structs.
- **Why:** Decouples persisted history from LLM vendor schema changes (**Extended by D174**: composite `(thread_id, turn)` index via migration `0004`).

### D148 & D163. Transactional Alembic migrations (`backend/migrations/`)
- **Choice:** Schema changes evolve exclusively via numbered Alembic migrations (`0001`–`0013`) with working `downgrade()` functions, transactional DDL, and SQLite explicit `BEGIN`/SAVEPOINT handling for isolated local checks. Startup refuses an unmigrated database.

### D151. Injected `Clock` port (`core/clock.py`)
- **Choice:** Time comes exclusively from `ctx.clock` / `ClockDep` (and `clock_today(clock, tz)` using user IANA time zones), never `date.today()` or `datetime.now()` (**Extended by D218**: `as_utc()` normalizes tz-aware values).

### D162. Optimistic concurrency via `expense.version`
- **Choice:** `expense.version` increments on every update (migration `0003`); `DeleteExpense` checks `expected_version` atomically in SQL (`WHERE id = ? AND owner_id = ? AND version = ?`).

### D164. Never hold DB connections across slow network/LLM I/O
- **Choice:** Use cases like `/parse` and `Assistant.decide` execute short reads, close the unit of work, perform external LLM/agent calls, and open a fresh short write transaction.

### D175 & D177. Vertical slices inside modules; separated shared layers
- **Choice:** Modules use one-file-per-slice (`commands/<name>.py`, `queries/<name>.py`, `values.py`, `persistence/`). App-wide code separates strictly into `core/` (pure domain primitives & ports), `infrastructure/` (Gemini, Neon, OIDC, Fernet, A2A), and `web/` (HTTP middleware & FastAPI dependencies).

### D215 & D216. Neon PostgreSQL runtime + 64-bit `BigInteger` money & atomic `category.name_key`
- **Choice:** Production and local dev run against PostgreSQL (`DATABASE_URL` via Psycopg 3); SQLite is restricted to explicit in-memory checks. Migration `0011` widened IDs and minor-unit amounts (`amount_minor`, `base_amount_minor`, `limit_minor`) from 32-bit `INT4` to 64-bit `BIGINT` (`> ₹2.14 Cr` safe) and added unique `category.name_key` (`strip().casefold()`) for race-free category deduplication.

---

## 2. AI Assistant, A2A Agents & Agent Skills (`D142–D147`, `D181–D183`, `D195–D209`)

### D142 & D166. Narrow LLM ports (`core/llm/`) with Gemini as one adapter
- **Choice:** Callers depend only on `StructuredOutputModel` or `ToolCallingModel` (`ask_for_json`, `stream_with_tools`); only `bootstrap.py` and agent `server.py` entrypoints instantiate `GeminiModel` (`infrastructure/llm/gemini.py`).

### D143, D144 & D145. Typed MCP tools used in-process by the assistant
- **Choice:** Assistant tools implement `ExpenseTools` via `McpExpenseTools` connected in-process to the `mcp` module's `MCPServer` (no localhost HTTP round-trip per tool call). Tools publish typed Pydantic schemas, separate previews (`get_expense`) from mutations, and gate `delete_expense` behind strict `confirmed=True`.

### D146. Persistent database-backed delete approvals (`pending_approval`)
- **Choice:** Delete cards persist surface IDs, thread IDs, owner IDs, and expense snapshots in SQL (capped at 200 per thread, expiring after 15 minutes). `TakeApproval` consumes a decision atomically once (**D170**).

### D147, D157 & D172. Plain-event core loop + pluggable `Surface` + server-written chip labels
- **Choice:** Agent turns emit transport-agnostic `AgentEvent` items (`TextDelta`, `ToolStarted`, `ToolFinished`, `ApprovalRequested`, `FormRequested`, `TurnFinished`). `WebPanel` and `TextChat` surfaces customize offered tools and UI directives, while `TOOL_CALL_START` / `TOOL_CALL_RESULT` carry localized `metadata.labels` from `api/chip_labels.py`.

### D167 & D170. Pre-stream validation on `POST /agent` and immutable paragraph boundaries
- **Choice:** FastAPI dependencies validate request shapes and thread state before opening the SSE response stream (422 problem responses on invalid inputs). Post-tool assistant text preserves explicit paragraph breaks.

### D181, D182 & D183. Separated `receipts` module & non-tool multimodal extraction
- **Choice:** Uploaded receipt bytes live behind `FileStore` (`core/files.py`), referenced by opaque `ReceiptId` rows (`receipt_file`, migration `0005`). Extraction calls `ask_for_json(attachments=...)` **with zero tools**, marking file content as untrusted data and presenting extracted values in an editable card before persistence (**Updated by D221**: `B2FileStore` replaced `LocalFileStore`).

### D195–D202 & D207. Standalone A2A agents (`agents/`) hosted in-process on `main`
- **Choice:** Specialist capabilities (`receipt`, `currency`, `insights`) follow the official A2A protocol (`a2a-sdk`, Agent Cards at `/.well-known/agent-card.json`) over `core/agents.RemoteAgents` (`infrastructure/a2a/`). Shared `agents/agent_kit` provides bearer auth (`AgentGate`), `ForgetfulTaskStore` (strips file bytes, retains max 20 tasks in memory), and request limits.
- **Deployment split (`D207`):** On `main`, `agents_host.py` mounts all three agents in-memory inside the backend process; `multi-server` runs them as separate HTTP services.

### D203–D206. Currency conversion, multi-currency INR normalization & insights delegation
- **Choice:** Every expense save calls `ExpenseRecorder`, querying `currency` (`convert_currency`) for non-INR currencies and persisting `base_amount_minor`, `exchange_rate`, and `rate_date` (migration `0008`). `assistant/delegation` discovers skills from verified Agent Cards at startup, constructs payloads strictly from owner-scoped server data (never leaking user notes or IDs to agents), and supports `INPUT_REQUIRED` follow-ups (`pending_delegation`, migration `0009`).

### D208 & D209. Progressive Agent Skills (`skills/`) & isolated script execution
- **Choice:** Repository-trusted skills (`categorization`, `monthly-report`) follow the `agentskills.io` progressive-disclosure format (`name` + `description` in system prompt -> `load_skill` body -> allow-listed `references/`). Executable scripts (such as `skills/monthly-report/scripts/compute_report.py`) are **never** read or invoked freely by the LLM: the server runs listed `scripts/*.py` via `python -I` with minimal allow-listed env vars, stdin/stdout JSON, and strict timeout/output bounds, then validates output with `reports.MonthlyReport`.

---

## 3. Security, Multi-Tenancy & Reliability (`D149–D152`, `D165`, `D180`, `D184–D194`, `D217–D218`)

### D149 & D165. Versioned `/api/v1` + RFC 9457 `application/problem+json` errors
- **Choice:** Every API error (including FastAPI validation and HTTP middleware exceptions) renders standard RFC 9457 Problem Details inside CORS/security middleware with `Cache-Control: no-store`.

### D150. Explicit opt-in for HTTP MCP (`/mcp/`) and removal of open `/ask`
- **Choice:** Removed unauthenticated `/ask` and protected `/mcp/` with `Origin` validation, rate limits, and constant-time bearer verification (**Updated by D191**: per-user Personal Access Tokens replaced the single shared `MCP_TOKEN`).

### D152 & D180. Zero secret/PII leakage to clients or INFO logs
- **Choice:** Prompts, user text, and tool args log only at `DEBUG`. User-facing error details, card text, and SSE `RUN_ERROR` messages come strictly from localized server catalogs (`AppError(translatable(...))`); raw SDK/DB/provider exceptions stay in server logs.

### D184–D187 & D189. Same-origin BFF authentication over OpenID Connect
- **Choice:** Next.js proxies `/api/*` on the same origin (eliminating CORS tokens in the browser). `accounts` (`app_user`, `user_identity`, `user_session`, `login_attempt`, migration `0006`) speaks standard OIDC via `IdentityProvider`, identifies users strictly by `(issuer, subject)` (never merging accounts by email), stores encrypted session/ID tokens server-side, and issues only an `HttpOnly; Secure; SameSite=Strict; Path=/` random session cookie paired with an `X-CSRF` header check.

### D190 & D191. Universal `owner_id` scoping & per-user MCP Personal Access Tokens
- **Choice:** Every user-owned table carries indexed `owner_id` (migration `0007`), every CQRS command/query requires `owner_id`, and handlers filter `WHERE id = ? AND owner_id = ?`. `access_token` issues `spw_`-prefixed 256-bit tokens (stored as SHA-256 hashes, max 10 active per user, configurable expiry) bound to `current_caller()`.

### D192, D193 & D194. Client session boundaries, strict security headers & model quotas
- **Choice:** `AuthGate` tears down React trees and caches on account changes; CSP, `X-Frame-Options`, `Referrer-Policy`, and `no-store` protect HTML and API responses (`web/security-headers.ts`, `web/security_headers.py`); expensive model/upload/auth routes enforce per-user/IP rate limits.

### D217 & D218. Defense-in-depth hardening & consistency
- **Choice:** Verified A2A Agent Cards before sending bearer keys, path-segment boundary validation on OIDC return paths, streaming `BodySizeLimitMiddleware` + `AgentGate` byte counting prior to disk spooling (`413` early rejection), Neon `pool_pre_ping`/`pool_recycle`, `automatic_continuation=False` on Gemini streams, atomic conversation turn numbering, deterministic month/date boundary helpers (`YearMonth`), and synchronous submit locks in the UI.

---

## 4. Web Architecture, Contracts, Budgets & Public Site (`D153–D161`, `D168–D169`, `D171–D179`, `D188`, `D210–D214`, `D219–D220`)

### D153, D154 & D168. Feature slices, TanStack Query scopes & resilient refresh
- **Choice:** UI organizes cleanly into `app/`, `features/<name>/`, and `shared/`, with import rules enforced by `oxlint`. Mutations and assistant completions declare `DATA_SCOPES` changes rather than hardcoding refetch graphs, retaining stale data alongside `RefreshNotice` when background refetches fail.

### D155, D160 & D169. Generated contracts (`export_contracts.py` -> `gen:api`) & pinned packages
- **Choice:** Zero hand-copied backend types or magic values in TypeScript (`openapi.json` + `contracts.gen.ts` -> `schema.gen.ts`). Frontend and Python dependencies pin exact versions for deterministic builds.

### D156 & D158. Schema-validated AG-UI streams, abortable requests & error boundaries
- **Choice:** Streaming SSE payloads validate against `@ag-ui/core` `EventSchemas.safeParse()`, Stop buttons cancel both uploads and assistant streams via `AbortController`, and isolated error boundaries wrap pages, chat panels, and every A2UI card.

### D159, D178 & D179. Unified CLDR/next-intl localization (`en` / `hi`) *(updated by D225)*
- **Choice:** Minor-unit integer paise (`BigInteger`) format identically on server (Babel CLDR) and browser (`Intl`). Both backend catalogs (`define_catalog` checked at startup for placeholder/key parity) and frontend `Translation<typeof en>` namespaces (originally `i18next` chunks, migrated to `next-intl` in **D225**) guarantee zero untranslated strings reach users.

### D171, D173 & D213. Living docstrings, pure seams & automated CI quality gates
- **Choice:** Every module and public symbol carries role/contract docstrings, and `.github/workflows/ci.yml` + `backend/scripts/check.py` run 9 checks (`compileall`, `ruff` check/format, `pyright`, 14 architecture/security rules in `check_rules.py`, `tsc -b`, `oxlint`, `prettier`, and `next build`) across Python 3.11+ (tested on 3.14 & 3.15, **D214**).

### D188. Migration to Next.js 16 App Router *(updated by D225)*
- **Choice:** Replaced SPA Vite/React Router with Next.js App Router while retaining `features/*`, TanStack Query, per-feature i18n namespaces (migrated from `i18next` to `next-intl` in **D225**), and same-origin BFF proxying—enabling true server-rendered HTML and metadata routes for public pages alongside client workspace chunks.

### D210, D211 & D212. `budgets` module & `SaveWatcher` port
- **Choice:** Monthly overall and category budgets live in `modules/budgets` (migration `0010`), reading spend live from `expenses`. To show live budget alerts on REST saves without introducing a `budgets <-> expenses` cycle, `expenses` defines `SaveWatcher` and `bootstrap.py` injects `budgets.BudgetWatch` across both REST and MCP save paths.

### D219 & D220. Grouped frame, command palette, reports/categories pages & bilingual SaaS site
- **Choice:** Added `/categories`, `/reports`, tabbed `/settings`, grouped sidebar navigation, `Ctrl/⌘ + K` Radix command palette, Next.js error boundaries (`D219`), moved the workspace dashboard to `/dashboard`, launched the server-rendered bilingual SaaS public site (`/`, `/features`, `/security`, `/faq`, `/privacy-policy`, `/terms-of-service`, `/contact` + `/hi/...`) with interactive animated Walkthrough preview, vector/adaptive favicons, SEO schema/sitemap/manifest, and implemented server-backed first-run onboarding (`CompleteWelcome`, migration `0012`) (`D220`).

### D221. Pluggable cloud object storage behind `FileStore` (Backblaze B2 adapter; no local disk fallback)
- **Choice:** Replaced `LocalFileStore` (`UPLOADS_DIR`) with `B2FileStore` (`infrastructure/storage/b2.py`, `b2_wire.py`) behind the provider-agnostic `FileStore` port, selected via `STORAGE_PROVIDER` in `bootstrap._FILE_STORES` (with `check_rules.py` rule 14 confining vendor references to `bootstrap.py` and `infrastructure/storage/`). When storage settings are unset (e.g. during contract export), `bootstrap._file_store()` injects fail-closed `UnconfiguredFileStore` (never writing to local disk); partial `B2_*` configuration fails validation at startup.
- **Why:** Stores all uploaded receipts in a private, card-free 10 GB cloud bucket without adding SDK dependencies (`boto3`/`b2sdk`), leaking vendor details into domain modules/`web/`, or changing `receipt_file.storage_key` (keys remain 32-hex UUIDs, grouped in the bucket via `B2_PREFIX`). Swapping providers later only requires adding a new `infrastructure/storage/<provider>.py` adapter and registering it in `bootstrap._FILE_STORES`.

### D222. Persisted user preferences & IANA time zones on `app_user`
- **Choice:** Added `preferred_language` (`"en"`), `default_currency` (`"USD"`, validated against `SUPPORTED_CURRENCIES`), and `timezone` (`"UTC"`, validated against stdlib `zoneinfo` + pinned `tzdata`) to `app_user` (migration `0013`), saved in `CompleteWelcome` (`POST /api/v1/account/welcome`) and updated via `PATCH /api/v1/account/preferences`. Attached preferences to `Principal` (`SessionGate`) and `TokenCaller` (`AccessTokens.resolve_caller`), and introduced `clock_today(clock, timezone)` so routes, budgets, reports, assistant turns, and MCP tools resolve dates in the caller's IANA zone without crossing module boundaries or altering UTC timestamp/quota storage.
- **Why:** Keeps user settings cross-device and accessible to browserless MCP/background callers while keeping `expenses`, `budgets`, `reports`, and `mcp` free of an `accounts` dependency.

### D223. Global USD base currency, `en-US` English formatting, `"Bank transfer"` labels & currency-agnostic settings propagation
- **Choice:** Switched the system base/default currency from `"INR"` to `"USD"` (`DEFAULT_CURRENCY = "USD"`, `BASE_CURRENCY = DEFAULT_CURRENCY`), restricted `SUPPORTED_CURRENCIES` to 2-decimal currencies (`USD`, `EUR`, `GBP`, `INR`, `CAD`, `AUD`, `SGD`, `CHF`, `AED`; excluding zero-decimal `"JPY"` so `MINOR_UNITS_PER_MAJOR = 100` remains exact per D203), switched English formatting from `en_IN`/`en-IN` to `en_US`/`en-US`, defaulted web expense payment method to `"card"`, and relabeled `"netbanking"` globally as `"Bank transfer"` (`"बैंक ट्रांसफ़र"` in Hindi) while keeping DB enum values unchanged. Replaced hardcoded currency text/keys/field names (`ReportText.BASE_CURRENCY_NOTE`, `ReportText.COLUMN_BASE_AMOUNT`, `ReportAmount`, `ExpenseView.base_amount`, `MOCK_BASE_RATES`, interpolated `{base_currency}`/`{currency}` placeholders, and `major_to_minor`/`minor_to_major` without legacy aliases) and wired `app_user.default_currency` from `Principal`/`TokenCaller`/`SignedInUser` into `POST /expenses`, `POST /parse`, `/chat`, `/agent`, receipt/assistant forms (`forms.py`), MCP `add_expense` (`current_currency()`), and web onboarding/assistant/add-expense defaults.
- **Why:** Aligns the default global experience and number grouping (`$125,000.50`) with international usage while ensuring UI/i18n strings and backend/MCP contracts stay decoupled from any single currency and honor each user's persisted `default_currency` setting.

### D224. Global categorization skill, first-run preference onboarding & Settings preference controls
- **Choice:** Expanded `skills/categorization/` (`SKILL.md` and `references/merchants.md`) and receipt/parser prompt examples (`agents/receipt/contract.py`, `expense_parser.py`) to cover global merchants and payment methods alongside regional ones. Added reusable `CurrencySelect` (`Intl.DisplayNames` over `SUPPORTED_CURRENCIES`) and searchable `TimezonePicker` (`Intl.supportedValuesOf("timeZone")` with GMT offset labels and browser detection via `Intl.DateTimeFormat().resolvedOptions().timeZone`) in `web/src/shared/components/`, wired them into `WelcomeDialog` (defaulting language to `"en"`, currency to `DEFAULT_USER_CURRENCY`, and timezone to detected browser IANA zone, saved via `POST /api/v1/account/welcome`) and Settings `PreferencesCard` + sidebar `LanguageMenu` (`PATCH /api/v1/account/preferences`), and synced returning users' `preferred_language` once on sign-in (`useSyncUserLanguage`).
- **Why:** Completes end-to-end globalization with zero new npm dependencies, zero hardcoded currency/timezone lists, and consistent preference persistence across devices, onboarding, sidebar switches, and Settings.

### D225. Migration to `next-intl` App Router i18n, `[lang]` + `proxy.ts` routing, and `<MessageScope>` namespacing
- **Choice:** Replaced `i18next` and `react-i18next` with `next-intl` while retaining per-feature namespaces (`AppConfig` + `AppMessages` in `web/src/i18n/global.d.ts`, strict `Translation<typeof en>`, and ICU MessageFormat plurals/placeholders). Consolidated duplicated `(public)` and `hi/` route trees plus `sign-in` into `app/[lang]/` with `generateStaticParams`, `setRequestLocale`, `PublicLink` (`web/src/i18n/navigation.ts`), Next.js 16 `src/proxy.ts` (`localePrefix: "as-needed"`), and `global-not-found.tsx`. Kept workspace `(app)` routes unprefixed using the `NEXT_LOCALE` cookie and `Accept-Language` SSR (`router.refresh()` on language change; `router.replace()` on `[lang]`), removed the `ClientRoot` `if (!ready) return null` SSR-blocking gate, introduced server `<MessageScope>` to scope client payloads per route, and added `useFormatters()` and `useMessageOf()` requiring explicit locale/translator arguments in `shared/lib/format.ts` and `errors.ts`.
- **Why:** Eliminates SSR blanking and hydration mismatches, removes duplicated public route files, ensures dynamic localized `<title>` metadata across interactive routes, avoids shipping unused namespaces to routes, and aligns frontend i18n cleanly with Next.js 16 App Router Server/Client boundaries.
