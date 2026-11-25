// The expenses feature's public API: other features and the app import ONLY from "@/features/expenses".
// Every other file in this folder is private, so it can change freely as long as these stay the same.
// - Expense: one expense's type (the Dashboard's recent list draws it).
// - ExpensesPage: the Expenses page (its route file under app/(client)/(app)/expenses/ draws it), loaded on first use.
// - expenseKeys: the cache keys, so app/_shell/query-client.ts can mark every expense list out of date.
// - useExpenses: a filtered list of expenses (the Dashboard shows the newest few with it).

import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

export type { Expense } from "./api"
export { expenseKeys, useExpenses } from "./queries"

/**
 * The Expenses page, loaded only when it's first shown (`expenses` and `categories` messages come from next-intl's
 * route provider).
 */
export const ExpensesPage = lazyWithRetry(async () => {
  const { ExpensesPage: page } = await import("./components/expenses-page")
  return { default: page }
})
