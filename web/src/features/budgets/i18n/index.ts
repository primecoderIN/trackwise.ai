// The "budgets" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("budgets")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "budgets" message catalog. */
export type BudgetsTexts = typeof en

/** Loads the "budgets" message catalog for `language`. */
export async function loadBudgetsMessages(language: Language): Promise<BudgetsTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
