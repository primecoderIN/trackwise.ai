// The budgets feature's public API: the app and other features import ONLY from "@/features/budgets".
// Every other file in this folder is private, so it can change freely as long as these stay the same.
// - BudgetsPage: the Budgets page (its route file under app/(client)/(app)/budgets/ draws it), loaded on first use.
// - budgetKeys: the cache keys, so app/_shell/query-client.ts can mark the budgets out of date.
// - useBudgetStatus, BudgetMeter: what the Dashboard's budget card uses.

import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

export type { BudgetStatus } from "./api"
export { BudgetMeter } from "./components/budget-meter"
export { BudgetStateBadge } from "./components/budget-state-badge"
export { budgetKeys, useBudgetStatus, useSetBudget } from "./queries"

/**
 * The Budgets page, loaded only when it's first shown (`budgets` messages come from next-intl's route provider).
 * Draw it inside a <Suspense> (app/_frame/app-layout.tsx does). If its code fails to load, the page's error
 * boundary shows the problem, and "Try again" loads it again.
 */
export const BudgetsPage = lazyWithRetry(async () => {
  const { BudgetsPage: page } = await import("./components/budgets-page")
  return { default: page }
})
