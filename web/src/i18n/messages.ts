// Server-side message loading and route-scoping utilities for next-intl namespaces.
// Allows layouts and routes to send only the translation namespaces each client subtree actually uses.

import { loadAppNamespace } from "@/app/_i18n"
import { loadAccountMessages } from "@/features/account/i18n"
import { loadAssistantMessages } from "@/features/assistant/i18n"
import { loadAuthMessages } from "@/features/auth/i18n"
import { loadBudgetsMessages } from "@/features/budgets/i18n"
import { loadCategoriesMessages } from "@/features/categories/i18n"
import { loadDashboardMessages } from "@/features/dashboard/i18n"
import { loadExpensesMessages } from "@/features/expenses/i18n"
import { loadReportsMessages } from "@/features/reports/i18n"
import { loadSplitsMessages } from "@/features/splits/i18n"
import { loadCommonMessages, type Language } from "@/shared/i18n"

import type { AppMessages } from "./global"

/** Union of every typed message namespace key. */
export type AppNamespace = keyof AppMessages

/** Baseline namespaces required on public layouts (`[lang]`) for shared chrome and errors. */
export const BOOT_MESSAGE_NAMESPACES = ["common", "app"] as const satisfies readonly AppNamespace[]

/** Baseline namespaces required across the signed-in workspace shell (including the assistant drawer). */
export const WORKSPACE_MESSAGE_NAMESPACES = [
  "common",
  "app",
  "auth",
  "assistant",
] as const satisfies readonly AppNamespace[]

/** Loads the typed message catalogs needed for `locale` (called per request in `src/i18n/request.ts`). */
export async function loadAppMessages(locale: Language): Promise<AppMessages> {
  const [common, app, auth, assistant, account, budgets, categories, dashboard, expenses, reports, splits] =
    await Promise.all([
      loadCommonMessages(locale),
      loadAppNamespace(locale),
      loadAuthMessages(locale),
      loadAssistantMessages(locale),
      loadAccountMessages(locale),
      loadBudgetsMessages(locale),
      loadCategoriesMessages(locale),
      loadDashboardMessages(locale),
      loadExpensesMessages(locale),
      loadReportsMessages(locale),
      loadSplitsMessages(locale),
    ])
  return { common, app, auth, assistant, account, budgets, categories, dashboard, expenses, reports, splits }
}

/** Selects a subset of loaded namespaces to serialize across a route's `<NextIntlClientProvider>`. */
export function pickMessages<K extends AppNamespace>(
  messages: AppMessages | Record<string, unknown>,
  namespaces: readonly K[],
): Partial<AppMessages> {
  const selected: Record<string, unknown> = {}
  const record = messages as Record<string, unknown>
  for (const name of namespaces) {
    if (Object.hasOwn(record, name)) {
      selected[name] = record[name]
    }
  }
  return selected as Partial<AppMessages>
}
