# trackwise.ai Documentation Hub

Technical and product documentation for **trackwise.ai**, organized by topic.

---

## Documentation Map

### 1. Product & Workflows
*Understand what the platform does, how users interact with it, and where it is headed.*

| Document | Summary |
|---|---|
| [Product Overview](overview.md) | Workspace views, public pages, AI assistant, receipt scanning, and MCP integrations |
| [How trackwise.ai Works](how_trackwise_works.md) | Visual Mermaid diagrams for authentication, dashboard/ledger UX, AG-UI streaming, delete approvals, A2A delegation, and MCP |
| [Roadmap](roadmap.md) | Delivered milestones and upcoming capabilities (recurring expenses, imports, team workspaces, billing) |

### 2. System & AI Architecture
*Inspect system structure, modularity, AI protocol orchestration, and trade-offs.*

| Document | Summary |
|---|---|
| [System Architecture](architecture.md) | Modular Monolith domain boundaries, CQRS-lite `MessageBus`, Ports & Adapters, Next.js feature slices, and 14 automated static checks |
| [Assistant & Multi-Agent Architecture](assistant_architecture.md) | AG-UI SSE streaming, server-validated A2UI cards/forms, DB-backed approvals, hosted A2A agents (`receipt`, `currency`, `insights`), and sandboxed Agent Skills |
| [Architecture Decisions (ADRs)](decisions.md) | Curated log of key architectural choices and rationale (`D1–D221`) |

### 3. Security, APIs & Data Model
*Review multi-tenant isolation, authentication, trust boundaries, HTTP contracts, and database design.*

| Document | Summary |
|---|---|
| [Security Architecture](security.md) | BFF OIDC auth, CSRF protection, `owner_id` query isolation, PAT hashing, upload/prompt-injection guardrails, A2UI safety, and CSP headers |
| [API Reference](api_endpoints.md) | REST `/api/v1/*` routes, OIDC auth endpoints, streaming `POST /api/v1/agent`, `/mcp/`, and RFC 9457 error responses |
| [Database Schema](database_schema.md) | PostgreSQL table layout across Alembic migrations `0001`–`0012`, 64-bit `BigInteger` money storage, indexes, and cross-module ID discipline |

### 4. Setup, Operations & Contributor Guides
*Run the project locally, configure external providers, or add new backend and frontend slices.*

| Document | Summary |
|---|---|
| [Getting Started](getting_started.md) | Local development setup, Neon PostgreSQL, Alembic migrations, seed script, and MCP desktop/HTTP connection |
| [Configuration](configuration.md) | Environment variables (`.env`), Gemini model limits, timeouts, body-size limits, and rate quotas |
| [Identity Provider Setup](identity_provider.md) | Step-by-step OpenID Connect configuration (ZITADEL / generic PKCE OIDC) and provider switching |
| [Backend Onboarding](backend_onboarding.md) | Adding vertical slices, CQRS commands/queries, modules, translations, and migrations |
| [Frontend Onboarding](frontend_onboarding.md) | Building Next.js feature slices, TanStack Query scopes, and typed EN/HI i18next chunks |
| [Repository Rules (`AGENTS.md`)](../AGENTS.md) | Coding rules, size limits, localization rules, and definition of done verified by CI |

---

## Keeping these docs current

Whenever a change touches any of the areas below, update its matching guide in the same commit:

- **User-visible features or public pages:** update [`overview.md`](overview.md) and [`roadmap.md`](roadmap.md).
- **Module boundaries, imports, or frontend structure:** update [`architecture.md`](architecture.md) (and `assistant_architecture.md` if AI flows change).
- **HTTP routes, payloads, or MCP tools:** regenerate `web/openapi.json` and `schema.gen.ts` (`backend/scripts/export_contracts.py` -> `npm run gen:api`) and update [`api_endpoints.md`](api_endpoints.md).
- **Tables or Alembic migrations:** update [`database_schema.md`](database_schema.md).
- **Environment variables, limits, or auth/security guarantees:** update [`configuration.md`](configuration.md) and [`security.md`](security.md).
- **Significant design trade-offs:** append a new ADR entry to [`decisions.md`](decisions.md) (and mark superseded entries rather than erasing history).
