// The reports feature's public API: the app imports ONLY from "@/features/reports".
// - ReportsPage: the Reports page (its route file draws it), loaded on first use.
// - reportKeys: so the app's refresh rule (app/_shell/query-client.ts) can reload reports after expense changes.

import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

export { reportKeys } from "./queries"

/**
 * The Reports page, loaded only when first shown (`reports` messages come from next-intl's route provider).
 */
export const ReportsPage = lazyWithRetry(async () => {
  const { ReportsPage: page } = await import("./components/reports-page")
  return { default: page }
})
