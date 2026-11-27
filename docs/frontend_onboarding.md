# Frontend Onboarding

A working guide to the web app (`web/`): Next.js 16 (App Router), React 19, TypeScript 7, Tailwind 4 and shadcn/ui,
organised as **feature slices**, with server data through **TanStack Query** and a client **generated from the
backend**. Next.js 16 differs from older versions: its docs ship in `node_modules/next/dist/docs/`.

## Running it

```powershell
cd web
npm install          # first time, and after package.json changes
npm run dev          # http://localhost:5173 (next dev); it forwards /api/v1 to the backend on :8000 (one origin)
npx tsc -b           # type-check
npm run build        # next build: type-check again, then build into .next/
npm run start        # next start: serve that build on :5173 (set API_PROXY_TARGET before building, not after)
npx oxlint           # lint, including the feature-slice import rules
npm run gen:api      # regenerate API types from openapi.json (after the backend's export script)
```

## Folder structure: feature slices

```
src/
  proxy.ts              Next.js 16 `next-intl` locale routing (`localePrefix: "as-needed"`)
  i18n/                 `routing.ts`, `navigation.ts` (`PublicLink`), `request.ts`, `messages.ts`, `global.d.ts`
  app/                  Next's route folder, and the composition: the only place that knows every feature
    global-error.tsx    last-resort root crash boundary outside providers
    global-not-found.tsx  app-wide 404 fallback
    robots.ts, sitemap.ts   for search engines: localized public pages
    [lang]/             SSG public pages & `/sign-in`: layout.tsx (`generateStaticParams`, `BOOT_MESSAGE_NAMESPACES`)
    (client)/           interactive workspace root: layout.tsx (cookie/`Accept-Language` SSR `<html lang dir>`)
      (app)/            the signed-in routes: layout.tsx (`AuthGate`, `AppLayout`), page.tsx (`<MessageScope>`)
    _shell/             client-root.tsx (root error boundary + providers), message-scope.tsx (route namespace scoping),
                        providers.tsx, query-client.ts, app-crashed.tsx
    _frame/             app-layout.tsx, app-sidebar.tsx, pages.tsx (the menu), welcome-dialog.tsx
    _views/             client-pages.ts (lazy client boundaries for signed-in pages & SignInPage)
    _public/            server-rendered marketing components (`components/`) and catalogs (`texts/`)
    _i18n/              the app frame's own typed texts (`app` namespace)
    _seo/               seo.ts: site address, `PUBLIC_PATHS`, hreflang & public/signed-in metadata
    _styles/            index.css
  features/
    expenses/           Expenses page: URL-synced filters, table & mobile cards, Add dialog, Edit sheet, Delete dialog
    categories/         categories API + queries, CategorySelect, category names
    budgets/            Budgets page: monthly overall and category limits, alerts
    splits/             Splits page (`/splits`, `/splits/join/[token]`): Personal/Shared groups, invites, settlements, INR UPI QR
    reports/            Reports page: monthly/category breakdowns and CSV/JSON exports
    dashboard/          Dashboard page: stat cards, charts, recent list
    assistant/          chat panel, conversation model, AG-UI stream, A2UI renderer
    auth/               sign-in page, the session check in front of the signed-in pages (AuthGate), user menu
    account/            the Settings page: profile, preferences, sessions, access tokens
  shared/               used by any feature; knows none of them
    api/                typed HTTP client (http.ts) + generated contract (*.gen.ts)
    ui/                 shadcn/ui components (generated source; edit freely)
    components/         error boundary, section error, refresh notice, empty state, placeholder page, labeled field, month picker, date picker, page skeleton
    config/             app name, routes, data scopes
    i18n/               languages and locales, NEXT_LOCALE helpers, `useLanguage`, language menu, `common` texts
    hooks/, lib/        use-mobile, use-debounced-value; `useFormatters`, `useMessageOf`, format, guards, errors, ids
    theme/              theme constants, provider, toggle
```

### The rules (enforced by `npx oxlint`)

| Rule | Why |
|---|---|
| A feature owns its components, hooks, API calls, types and constants | one place to look, and to change |
| Other code imports a feature **only through its `index.ts`** (`@/features/expenses`) | the index is the feature's contract; its files can change freely |
| Inside a feature, imports are **relative** (`../queries`) and never climb out of it | `@/features/x/...` from inside x would look like a deep import |
| `shared/` imports no feature and nothing from `app/` | anything may use it, so it can't depend on anything above it |
| Only `app/` wires features together | e.g. the assistant says "data changed"; `app/` decides what reloads |

Cross-feature imports are allowed through the index, but keep them few (today: the Dashboard uses `useExpenses` and
`useCategories`; Expenses uses `CategorySelect`).

## Anatomy of a feature

```
features/expenses/
  index.ts             public API: ExpensesPage (loaded on demand), expenseKeys, useExpenses, type Expense
  api.ts               typed API calls + the types (from the generated schema)
  queries.ts           TanStack Query keys, hooks and mutations
  expense-form.ts      a draft's rules: empty, from an expense, to a request, what changed (pure)
  filter-params.ts     URL query-string parsing/serialisation for filters and quick date presets (pure)
  use-expense-draft.ts a draft being typed, for the Add dialog and the Edit sheet
  payment-methods.ts   labels and the list, from the generated contract
  components/
    expenses-page.tsx  the page: composes the parts below
    table/             the table, mobile card list, columns and sort button, toolbar, and editor hook
    dialogs/           Add expense dialog, Edit expense slide-over sheet, Delete expenses confirmation
    filters/           the filter card (search, category, calendar date pickers, quick date presets)
    fields/            form controls shared by the dialogs/sheet and filters (LabeledField is shared/components')
  i18n/
    en.ts              every text the feature shows, in English ICU MessageFormat (source and keys' type)
    hi.ts              the same keys in Hindi (`satisfies Translation<typeof en>`)
    index.ts           the `*Texts` type and async `load*Messages(language)` loader (`src/i18n/messages.ts`)
```

A folder that grows past a handful of files is grouped by area like this. Imports stay relative inside the feature;
`npx oxlint` checks that none leaves it, at every folder depth.

Each component does one job and stays small (a file under about 150 lines of code, a component or hook under about
60). Logic that doesn't need React is a pure function in its own file, so it can be tested without rendering.

## Talking to the backend

### The typed client

`shared/api/http.ts` creates one **openapi-fetch** client typed by `schema.gen.ts`, which is generated from the
backend's OpenAPI document. A path, parameter or body the API doesn't accept is a compile error:

```ts
// features/expenses/api.ts
export type Expense = Schemas["ExpenseRead"]          // types come from the backend, never written by hand

export function listExpenses(filters: ExpenseFilters, signal?: AbortSignal): Promise<ExpenseList> {
  return unwrap(api.GET("/api/v1/expenses", { params: { query: filters }, signal }))
}
```

- `unwrap()` returns the data, or throws an **`ApiError`** with the problem's `detail` (every backend error is an RFC
  9457 problem). A dropped connection becomes "Can't reach the trackwise.ai API…".
- `unwrapEmpty()` is for 204 answers (deletes).
- An aborted request (the page was left, Stop was pressed) is re-thrown as is, so TanStack Query can ignore it.

### Server state: TanStack Query

Each feature defines **keys** and **hooks** in `queries.ts`:

```ts
export const expenseKeys = {
  all: ["expenses"] as const,
  list: (filters: ExpenseFilters) => [...expenseKeys.all, "list", filters] as const,
}

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: ({ signal }) => listExpenses(filters, signal),   // cancelled when no longer needed
    placeholderData: keepPreviousData,                        // keep old rows while new filters load
  })
}
```

**Mutations declare what they changed**, and the app decides what that makes stale:

```ts
export function useCreateExpense() {
  return useMutation({ mutationFn: createExpense, meta: { changes: DATA_SCOPES.expenses } })
}
// app/_shell/query-client.ts: a MutationCache onSettled → refreshAfter(client, meta.changes)
//   → invalidates every key that STALE_AFTER lists for that scope (expenses and the Dashboard)
```

The assistant uses the same rule: on a `STATE_SNAPSHOT` it calls `onDataChanged`, which `app/_shell/providers.tsx` wires
to `refreshAfter(queryClient, DATA_SCOPES.expenses)`. So no feature needs to know which pages show expenses, and a new
data scope without an entry in `STALE_AFTER` is a compile error.

Never fetch in a `useEffect` by hand: use a query.

### Loading and errors on a page

| State | Show |
|---|---|
| nothing loaded yet | a skeleton (`DashboardSkeleton`) or "Loading…" |
| nothing loaded, request failed | `<SectionError>` with **Try again** (retrying only what failed) |
| data on screen, a reload failed | keep the data, add `<RefreshNotice>` ("Couldn't refresh, so this may be out of date") |
| a mutation failed | a toast with the problem's message (`useMessageOf()`); keep the user's input |

`useMessageOf()` wraps `messageOf(error, translate)` so only messages written for people appear: an `ApiError` (the
server's `detail`), an `AgentRunError`, a `StreamError` (in assistant), or a `UserFacingError` with a `common.errors`
key. Anything else (a crash) shows the localized generic "Something went wrong" text, and `reportUnexpected` logs it to
the console (D180). So throw `UserFacingError` for a message a person should read.

## Signing in

The session is a cookie the page can't read (HttpOnly), so the web app never handles a token: it asks the server who
is signed in (`GET /auth/user`, the auth feature's `useSignedInUser`) and gets a person or `null` (D186, D189).

- **Every page in `app/(client)/(app)/` is behind `AuthGate`** (that group's layout): nobody signed in goes to
  `/sign-in?return_to=<the page>`. A new signed-in page needs nothing extra.
- **A feature never handles a 401 itself.** The query client (`app/_shell/query-client.ts`) asks who is signed in
  again after any query's or mutation's 401, and the gate sends the person to sign in.
- **Signing in and out are navigations**, not API calls: the sign-in page's buttons are links to the backend's login
  route, and the user menu's Sign out opens the `logout_url` from `/auth/user`.
- Every API call carries `X-CSRF: 1` (`apiHeaders()`): `api` adds it; a direct `fetch` spreads `apiHeaders()` in.
- **A page never outlives its person** (D192): when the session ends, or someone else signs in in another tab, the
  gate unloads the page (a full navigation or a reload), so nothing of the previous person stays in memory. Keep a
  person's data in memory or on the server, never in browser storage, and this keeps working by itself.
- **Everything is the person's own on the server** (D190): a feature never sends an owner, and an id that isn't
  theirs comes back as a 404. Links the server sends are followed only if they stay on this site (`ownSitePath`).

## The generated contract

| File | Holds | Use it for |
|---|---|---|
| `shared/api/schema.gen.ts` | every route's types, plus enum value lists (`paymentMethodValues`) | `Schemas["ExpenseRead"]`, `paths`, enums |
| `shared/api/contracts.gen.ts` | `API_PREFIX`, `DEFAULT_CURRENCY`, `BASE_CURRENCY`, `DEFAULT_USER_CURRENCY`, `SUPPORTED_CURRENCIES`, `DEFAULT_TIMEZONE`, `LANGUAGES` (the server's), `LIMITS` (including `receiptBytes`), `RECEIPT_MEDIA_TYPES`, `PAYMENT_METHOD_LABELS` (by language), `A2UI` (catalogs, components, chart types, actions, client functions), `REPORT_FORMATS`, `MONTH_PATTERN`, `AGUI` (event names, metadata keys, `receiptProvider`), `AUTH`, `ACCOUNT` | any value the backend also uses |

Never edit them. After a backend change: run `backend\scripts\export_contracts.py`, then `npm run gen:api`.

## UI

- **shadcn/ui** components live in `shared/ui/` as source (`components.json` points the shadcn CLI there:
  `npx shadcn@latest add <name>`). They're the only files the lint rules don't hold to app standards.
- **Tailwind 4** with CSS variables (`app/index.css`); dark mode is a `dark` class on `<html>`, set before the first
  paint by a script generated from `shared/theme/theme-constants.ts`.
- **Formatting** goes through `useFormatters()` (binding the active `next-intl` locale's BCP 47 tag into
  `shared/lib/format.ts`): `formatMoney("1250.5", "USD")` → `$1,250.50` (the currency's CLDR format, matching the
  backend's cards), `formatDate`, `formatMonth`.
- **The server's language:** the API client and the assistant's stream send `Accept-Language` (read from
  `document.documentElement.lang`, kept in sync with `NEXT_LOCALE` and `<html lang>`), so error details, cards, chip
  labels and the assistant's replies come back in it.
- **Every call carries `apiHeaders()`** (`shared/api/http.ts`): the language and `X-CSRF: 1`, without which the API
  answers 403 (D186). `api` adds them itself; a direct `fetch` (the assistant's stream) spreads them in. The session
  is a cookie the browser sends by itself (same origin, D184): the app never sees or stores a token.
- **Charts:** shadcn charts (Recharts 3). A chart config's keys become CSS variables; keep configs fixed.

## The assistant feature

| File | Job |
|---|---|
| `model/assistant-provider.tsx`, `model/assistant-context.ts` | holds the conversation above the pages (it survives closing the panel); `useAssistant()` |
| `model/use-chat.ts` | the conversation, wiring the pieces below: sending, **Stop**, form values and submits. `useChat(onDataChanged, runAgentFn)` takes the stream function, so a fake can stand in |
| `model/use-agent-run.ts` | one run's lifecycle: the thread id, the data version, aborting, `sending` |
| `model/transcript.ts`, `model/run-progress.ts` | pure: how each AG-UI event changes the messages; which tools are still running and whether data may have changed (the form-unlock rule) |
| `model/chat-types.ts` | the conversation's types (messages, tool activity) |
| `api/agent-stream.ts`, `api/sse.ts`, `api/agent-events.ts` | `runAgent()`: POST the run, read the SSE stream (`sse.ts` splits it into events), validate each event with `@ag-ui/core`'s schemas; pure readers for event payloads |
| `components/` | the panel (header), the transcript, the composer (its own state, so typing doesn't redraw the cards), a message bubble, a tool chip; `lazy-chat-panel.tsx` loads the panel's code in the background |
| `a2ui/` | the A2UI renderer: `protocol.ts` (messages, data model, size check), `a2ui-surface.tsx` (draws a surface by looking each component up in `catalogs.ts`, the allow-list), `renderer-types.ts`; `renderers/` (`basic-components.tsx`, inputs, insights (Chart, Stat), `basic-catalog.ts` (the spec's vocabulary and limits), pure `insight-data.ts`); `buttons/` (pure `actions.ts`, `use-button-click.ts`: a click sends the event or runs a client function; `functions/`: the allow-listed client functions, `downloadReport`, D209) |

How it works end to end: [assistant_architecture.md](assistant_architecture.md).

## Recipes

### Add a page

1. Build it in its feature (`features/budgets/components/budgets-page.tsx`) and export it from the feature's
   `index.ts` through `lazyWithRetry` (`shared/lib/lazy-with-retry.ts`), so its code loads on first use. If that
   load fails, the page area's error boundary shows it, and its **Try again** loads the code afresh:
   ```ts
   export const BudgetsPage = lazyWithRetry(async () => {
     const { BudgetsPage: page } = await import("./components/budgets-page")
     return { default: page }
   })
   ```
2. Re-export it from `app/_views/client-pages.ts` (the client boundary the route files draw pages through).
3. Add its address to `ROUTES` (and `WORKSPACE_ROUTES` for signed-in pages, so `proxy.ts` leaves it unprefixed and
   `robots.ts` disallows crawling it) in `shared/config/routes.ts`, and create its route file,
   `app/(client)/(app)/budgets/page.tsx`: a server component that exports `generateMetadata`
   (`privatePage(t("pages.budgets"))` from `app/_seo/seo.ts`) and renders
   `<MessageScope namespaces={["budgets", "categories"]}><BudgetsPage /></MessageScope>`. Being in `(app)/`, it's
   behind the session check. A public page goes under `app/[lang]/(public)/` instead, exports `generateMetadata` with
   `publicPage(title, path, { lang })`, uses `app/_public/texts/`, and joins `PUBLIC_PATHS` in `app/_seo/seo.ts`.
4. Add one entry to `PAGES` in `app/_frame/pages.tsx` (path, key, icon) for the menu, and the page's name under
   `pages` in `app/_i18n/en.ts` and every other language's file.

### Add a feature

`features/<name>/` with `index.ts`, `api.ts` (calls through `api` + `unwrap`), `queries.ts` (keys, hooks; mutations
with `meta.changes`), `components/`, and `i18n/` (`en.ts`, `hi.ts`, and `index.ts` exporting `*Texts` and
`load*Messages(language)`). Register the namespace in `src/i18n/global.d.ts` (`AppMessages`) and `src/i18n/messages.ts`
(`loadAppMessages`), and include its namespace name (plus any dependency like `"categories"`) in `<MessageScope
namespaces={[...]} />` inside the route's `page.tsx`. If its changes should refresh other data, add a scope to
`shared/config/data-scopes.ts` and its entry to `STALE_AFTER` in `app/_shell/query-client.ts` (the compiler insists).

### Add an API call

1. The backend route exists and the contract is regenerated.
2. A function in the feature's `api.ts`: `unwrap(api.GET("/api/v1/...", { params, signal }))`.
3. A hook in `queries.ts` with a key under the feature's `all`.

### Add or change a text

1. Add the key to the feature's `i18n/en.ts`, grouped with its neighbours, in English ICU MessageFormat. A sentence is
   one key; values use `{placeholder}`; counts use `{count, plural, =0 {...} one {...} other {...}}`.
2. Add the same key to every other language's file (`hi.ts`). Until you do, `tsc -b` fails on `Translation<typeof en>`,
   so no language can miss a key.
3. Use it in a component with `const t = useTranslations("<namespace>")` (or `getTranslations` in Server Components /
   `generateMetadata`), then `t("group.key", { name })`. Outside React, throw typed errors or accept formatted callbacks
   from hooks rather than reading translations from a global singleton.

### Add a language

1. The server first (backend_onboarding.md, "Recipe: add a language"), then regenerate the contract.
2. One entry in `LANGUAGES` (`shared/i18n/languages.ts`): its code (a BCP 47 tag, like `pt-BR`), its name in itself,
   its Intl locale, its writing direction, and a loader for its react-day-picker locale. The table is typed against
   the server's `LANGUAGES`, so a language one side lacks fails `tsc`.
3. One file per namespace, next to `hi.ts` (`common`, `app`, every feature, plus `app/_public/texts/`), typed
   `Translation<typeof en>`, and its loader in that namespace's `i18n/index.ts`. The compiler lists every namespace
   that lacks either.
4. A language with differing CLDR plural categories expresses them directly in its ICU `{count, plural, ...}` string.
5. Right-to-left languages also need the layout mirrored; that isn't supported yet.

### Draw a new A2UI component

1. The backend allows it (a model in `assistant/a2ui/models/`, `basic.py` or `insights.py`, added to `Component` in
   `messages.py`), so it's in `A2UI.components` after regenerating.
2. A renderer component (`A2uiRendererProps`: the node, the render context, and functions to draw children) in
   `basic-components.tsx`, `a2ui-inputs.tsx` or `a2ui-insights.tsx`, reading each property defensively (`typeof`,
   `pick()`, `textOf()`), never trusting the shape.
3. One entry in `CATALOGS` (`catalogs.ts`), under its catalog and `A2UI.components.X`. Nothing else changes: the
   surface looks components up there, and anything not listed is drawn as a "Can't show …" note.

## Conventions

- **Types, not casts:** network data is checked (`isObject`, schema validation) rather than asserted with `as`.
- **No magic strings or numbers:** a value used twice, or shared with the backend, is a named constant: in the
  feature, in `shared/config`, or from the generated contract.
- **No text in code:** every text a person sees or hears (labels, `aria-label`s, toasts, placeholders) is a key in
  the feature's `i18n/en.ts`, translated in every other language's file (D178).
- **Formatting is Prettier's** (`npm run format`; `web/.prettierrc.json`): no hand formatting, no style debates.
- **Effects only for the outside world** (subscriptions, timers, the DOM); derive everything else during render.
  `useSyncExternalStore` for browser state like media queries.
- **Error boundaries** around the app, the page area, the chat panel and every A2UI card.
- **Accessibility:** every control has a label (a `<Label>`, or an `aria-label` naming its row: "Edit #14"); sortable
  headers set `aria-sort`; the chat transcript is a `role="log"` live region; real list and status elements over ARIA
  roles; `npx oxlint` runs jsx-a11y.
- **Inline documentation** (D171): every file starts with a `//` header (what it's for, where it sits, who uses it);
  every exported function, component, hook, constant and type has a `/** */` comment (VS Code shows it on hover);
  `//` comments explain logic and the rules behind it. No comments inside JSX markup: explain it in the component's
  comment or above the `return`.
- **Comments say why**, in plain words.

## Checking your change

Automated tests aren't part of the repository yet. Until they are, before asking for a review:

1. `npx tsc -b` and `npx oxlint` are clean (warnings only inside `shared/ui`).
2. `npm run build` passes.
3. Try it in the browser with the backend running: the happy path, an error (stop the backend), and a narrow window.
4. If the backend changed: the contract is regenerated and committed.
