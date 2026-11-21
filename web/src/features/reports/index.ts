// The reports feature's public API: the app imports ONLY from "@/features/reports".
// - ReportsPage: the Reports page (its route file draws it), loaded on first use with its texts.
// - reportKeys: so the app's refresh rule (app/_shell/query-client.ts) can reload reports after expense changes.

import { loadNamespaces } from "@/shared/i18n"
import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

import { reportsTexts } from "./i18n"

export { reportKeys } from "./queries"

/**
 * The Reports page, loaded only when first shown, together with its texts.
 */
export const ReportsPage = lazyWithRetry(async () => {
  const [{ ReportsPage: page }] = await Promise.all([import("./components/reports-page"), loadNamespaces(reportsTexts)])
  return { default: page }
})
