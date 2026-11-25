// The dashboard feature's public API: the app imports ONLY from "@/features/dashboard".
// Every other file in this folder is private, so it can change freely as long as these stay the same.
// - DashboardPage: the Dashboard page (its route file under app/(client)/(app)/dashboard/ draws it), loaded on first use.
// - dashboardKeys: the cache keys, so app/_shell/query-client.ts can mark the Dashboard's totals out of date.

import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

export { dashboardKeys } from "./queries"

/**
 * The Dashboard page, loaded only when it's first shown (`dashboard` and `categories` messages come from next-intl's
 * route provider).
 */
export const DashboardPage = lazyWithRetry(async () => {
  const { DashboardPage: page } = await import("./components/dashboard-page")
  return { default: page }
})
