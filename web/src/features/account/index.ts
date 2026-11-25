// The account feature's public API: the app imports ONLY from "@/features/account".
// - SettingsPage: the Settings page (its route file draws it), loaded on first use.
// - accountKeys: so the app's refresh rule (app/_shell/query-client.ts) can reload the sessions and tokens lists.

import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

export { accountKeys, useCompleteWelcome, useUpdatePreferences } from "./queries"

/**
 * The Settings page, loaded only when it's first shown (`account` messages come from next-intl's route provider).
 * Draw it inside a <Suspense> (app/_frame/app-layout.tsx does). If its code fails to load, the page's error
 * boundary shows the problem, and "Try again" loads it again.
 */
export const SettingsPage = lazyWithRetry(async () => {
  const { SettingsPage: page } = await import("./components/settings-page")
  return { default: page }
})
