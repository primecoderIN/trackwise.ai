# trackwise.ai Web Application (`web/`)

The **Next.js 16.4.6** (App Router) frontend for **trackwise.ai**, written in React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query, and i18next.

It serves two distinct rendering surfaces on one origin:
- **`app/(public)/`**: Server-rendered bilingual (`en` and `/hi`) pages (`/`, `/how-it-works`, `/features`, `/faq`, `/contact`, plus `/privacy-policy` and `/terms-of-service` for consent and sign-in) with technical SEO (`metadata`, `hreflang`, JSON-LD, `opengraph-image.tsx`, `manifest.ts`, `robots.ts`, `sitemap.ts`).
- **`app/(client)/`**: Client-rendered Backend-for-Frontend (**BFF**) workspace (`ClientRoot`) protected by session checks (`AuthGate`), `X-CSRF` headers, and relative `/api/v1/*` rewrites configured in `next.config.ts`.

---

## Development Scripts

Run all commands from inside `web/`:

| Script | Command | Purpose |
|---|---|---|
| **Start Dev Server** | `npm run dev` | Runs `next dev --port 5173` with `/api/*` rewrites to FastAPI (`127.0.0.1:8000`) |
| **Production Build** | `npm run build` | Builds SSR pages, metadata routes, icons, and client bundles |
| **Serve Production Build** | `npm start` | Starts the compiled Next.js server on port `5173` |
| **Lint & Slice Boundaries** | `npm run lint` | Runs `oxlint` (enforcing feature-slice import rules and `jsx-a11y`) |
| **Format Code** | `npm run format` | Formats `src/` with Prettier (`web/.prettierrc.json`) |
| **Check Formatting** | `npm run format:check` | Verifies Prettier formatting without modifying files |
| **Regenerate API Types** | `npm run gen:api` | Generates `src/shared/api/schema.gen.ts` from `openapi.json` via `openapi-typescript` |

> Whenever backend routes, DTOs, limits, labels, or AG-UI / A2UI contract constants change, first run `..\.venv\Scripts\python.exe backend\scripts\export_contracts.py` from the repository root, then run `npm run gen:api` here.

---

## Frontend Architecture Rules

- **Strict Feature Slices:** Features in `src/features/<name>` communicate with each other and with `src/app` only through their public `index.ts` barrel. Inside a feature, imports stay relative. `src/shared` imports neither `features/` nor `app/`. Enforced by `.oxlintrc.json`.
- **Single-Source Server State:** All API requests use `openapi-fetch` (`src/shared/api`) paired with generated OpenAPI types (`schema.gen.ts`) and TanStack Query hooks. Mutations declare `meta: { changes: DATA_SCOPES.x }`; `app/_shell/query-client.ts` handles cache invalidation uniformly.
- **Lazy Bilingual Translations:** Every feature owns typed English (`en.ts`) and Hindi (`hi.ts`) chunks loaded lazily with its route or drawer (`i18next` + `react-i18next`). Zero hardcoded UI literals in components.
- **Safety Boundaries:** The A2UI renderer (`features/assistant/`) treats server/LLM payloads as untrusted—enforcing component allow-lists, object-property guards, depth/count limits, and per-card React error boundaries.

---

## Directory Layout

```text
web/
├── next.config.ts                    # Same-origin /api rewrite & security header wiring
├── security-headers.ts               # CSP, Referrer-Policy, Permissions-Policy & HSTS helpers
├── openapi.json                      # Exported backend OpenAPI spec (generated)
└── src/
    ├── app/
    │   ├── favicon.ico               # Multi-size favicon + favicon.svg in public/
    │   ├── icon.tsx / apple-icon.tsx # Dynamic 32x32 & 180x180 brand icons
    │   ├── opengraph-image.tsx       # Default social share preview (next/og)
    │   ├── manifest.ts               # Web App Manifest
    │   ├── robots.ts / sitemap.ts    # Bilingual crawler rules & sitemap
    │   ├── layout.tsx / error.tsx    # Root HTML layout, global & client error boundaries
    │   ├── (public)/                 # SSR public SaaS pages (EN root + hi/* Hindi routes)
    │   ├── (client)/                 # ClientRoot: /sign-in + authenticated /(app)/* routes
    │   ├── _frame/                   # Grouped sidebar menu, topbar, NavProgressBar, Ctrl+K palette, WelcomeDialog
    │   ├── _public/                  # Public site header/footer, WalkthroughPlayer, feature previews
    │   ├── _seo/                     # Metadata builders, canonical/hreflang helpers, JSON-LD generators
    │   ├── _shell/                   # QueryClientProvider, theme/i18n bootstrap, auth session gate
    │   ├── _i18n/                    # App-frame & auth English/Hindi resources
    │   └── _views/                   # Lazy page wrappers re-exported from feature slices
    ├── features/
    │   ├── account/                  # /settings tabs (Profile, Preferences, Security, Developer/PATs)
    │   ├── assistant/                # AG-UI SSE stream client, A2UI renderer, receipts & approval cards
    │   ├── auth/                     # BFF sign-in flow, AuthGate, session boundary cleanup, UserMenu
    │   ├── budgets/                  # /budgets monthly limit setup & progress tracking
    │   ├── categories/               # /categories shared category breakdown & monthly totals
    │   ├── dashboard/                # /dashboard KPIs, charts & spending breakdown
    │   ├── expenses/                 # /expenses paginated ledger, filters, add/edit/delete dialogs
    │   └── reports/                  # /reports monthly summaries, comparison & CSV/MD exports
    └── shared/
        ├── api/                      # openapi-fetch client, CSRF headers, generated schema/contracts
        ├── components/               # Reusable PageHeader, EmptyState, RefreshNotice, ErrorBoundary
        ├── config/                   # App metadata & navigation constants
        ├── hooks/ / lib/ / theme/    # Locale formatters, error mapping (UserFacingError), themes
        └── ui/                       # shadcn/ui + Radix primitives
```

For step-by-step instructions on adding a feature slice or route, see [Frontend Onboarding](../docs/frontend_onboarding.md).
