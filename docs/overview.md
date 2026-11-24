# trackwise.ai Product Overview

**trackwise.ai** is a personal finance and expense intelligence web application built around a fast, privacy-conscious workspace and an embedded AI assistant. It gives people full manual control over expenses, categories, budgets, and reports—while allowing natural language, receipt uploads, and external AI clients to work across the exact same data safely.

---

## 1. Public Website & Onboarding (English & Hindi)

Unauthenticated visitors land on a server-rendered, SEO-optimized public website at `/` (English) and `/hi` (Hindi):

- **Marketing Routes:** `/` (Home + Interactive Walkthrough Player), `/how-it-works`, `/features`, `/faq`, `/contact`, and their Hindi counterparts under `/hi/...`. `/privacy-policy` and `/terms-of-service` remain accessible from onboarding consent and sign-in; `/security` permanently redirects to `/faq`.
- **Interactive Product Walkthrough:** Embedded animated preview demonstrating chat expense logging, receipt scan confirmation, delete safety prompts, and monthly budget/report exports.
- **First-Run Workspace Welcome:** After signing in via OpenID Connect, new users complete a one-time onboarding dialog stored on the server (`CompleteWelcome`): selecting preferred language (`en` / `hi`), optionally setting an initial monthly overall budget, accepting the current terms version, and optionally trying a starter assistant prompt. Signed-in visitors returning to `/` see an **Open Dashboard** button right in the header/hero.

---

## 2. Signed-In Workspace (`/dashboard`, `/expenses`, `/budgets`, `/categories`, `/reports`, `/settings`)

All signed-in routes sit inside a unified frame with light/dark theme switching, live English/Hindi UI switching, and a zero-dependency **Command Palette (`Ctrl/⌘ + K`)** for keyboard navigation and quick expense entry:

- **Dashboard (`/dashboard`):** Monthly total spend in normalized base currency (`USD`, D223), percentage comparison against the previous month, transaction counts, category breakdown bar/list, payment-method distribution, and daily spending charts. Month switching lets users review historical periods seamlessly.
- **Expenses Ledger (`/expenses`):** Server-paginated, filterable table (by month, category, merchant search, payment method, and date range) with inline add/edit dialogs supporting multi-currency entry, optimistic concurrency checks on edits/deletes, and instant budget threshold toast notices on save.
- **Monthly Budgets (`/budgets`):** Set an overall monthly budget and/or per-category monthly caps. Progress bars highlight approaching (`>= 80%`) and exceeded (`> 100%`) limits, and saving/editing an expense from **any** surface (UI, Assistant, or MCP) triggers localized budget alerts when thresholds cross.
- **Categories (`/categories`):** View all 8 curated categories (`Food`, `Transport`, `Shopping`, `Bills`, `Entertainment`, `Health`, `Travel`, `Other`) with monthly spending summaries and icons.
- **Reports (`/reports`):** Structured monthly summary featuring total spend, month-over-month delta, daily average, category and payment breakdowns, largest expenses, and one-click **CSV** (formula-injection sanitized) or **Markdown** downloads.
- **Settings (`/settings`):** Organized into four tabs:
  - **Profile:** Connected OIDC identity details.
  - **Preferences:** Persistent language (`English` / `हिन्दी`) and theme selection.
  - **Security:** Session visibility and sign-out controls.
  - **Developer:** Manage scoped **Personal Access Tokens (`spw_...`)** with selectable expiration (`30`, `90`, `365` days) and instant revocation for MCP clients.

---

## 3. Streaming AI Assistant & Specialised Agents

Docked beside every workspace view (`AssistantProvider` over **AG-UI** Server-Sent Events), the assistant collaborates across user finances without hiding edits:

- **Conversational Logging & Search:** Understands casual Hinglish/English prompts (*"Paid 420 via UPI at Swiggy today"* or *"Show food spends this month"*), renders live progress chips (*"Saving expense…"*) in the active language, and syncs frontend queries immediately on completion.
- **Rich Interactive Cards (A2UI):** Renders validated spending breakdown charts, KPI stat strips, budget progress meters, editable confirmation forms (for ambiguous entries or scanned receipts), and two-step **database-backed delete approvals** (adds/edits execute directly; deletes always require explicit human approval).
- **Multi-Modal Receipt Extraction:** Uploading an image/PDF in chat or via upload routes stores bytes separately from SQL and routes them to the isolated `receipt` A2A specialist agent (`extract_receipt`). Extracted merchant, amount, currency, date, category, and payment method appear inside an editable form—nothing is saved until confirmed.
- **Multi-Currency Conversion (`currency` agent):** Expenses in another currency query exchange rates (`convert_currency`) on save so original currency is preserved alongside normalized `BigInteger` base-currency totals (`base_amount_minor`).
- **Spending Insights (`insights` agent) & Agent Skills:** Combines deterministic server-computed aggregates with contextual AI recommendations (`analyze_spending`) and curated Agent Skills (`categorization` guidelines and `monthly-report` isolated `python -I` calculations).

---

## 4. External MCP Access (`/mcp/`)

Any standard **Model Context Protocol** client (Claude Desktop, Cursor, or custom CLI agents) can connect via:
- **Stdio (`backend/mcp_stdio.py`)** for local workstation sessions, or
- **Streamable HTTP (`POST /mcp/`)** guarded by `Origin` checks, rate limits, and Personal Access Tokens.

All MCP tools (`add_expense`, `edit_expense`, `delete_expense` with `confirmed=true`, `search_expenses`, `get_summary`, `get_budgets`, `set_budget`, `get_monthly_report`, etc.) enforce the exact same CQRS rules, per-owner `owner_id` filtering, and budget alert checks as the web app.

---

## Deliberate Scope Boundaries

- **Single user per account:** Expenses, budgets, conversations, receipts, and PATs belong strictly to one authenticated `UserId`. Shared family/team workspaces are planned for a later phase ([Roadmap](roadmap.md)).
- **Curated global categories:** Categories are seeded across the workspace (`seed.py`) to keep cross-currency reporting, Agent Skills, and charts consistent.
- **Safe client-side state:** Zero financial records or tokens live in `localStorage` or `sessionStorage`; switching accounts or signing out cleanly resets all active client memory and SSE streams.
