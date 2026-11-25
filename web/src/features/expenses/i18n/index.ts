// The "expenses" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("expenses")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "expenses" message catalog. */
export type ExpensesTexts = typeof en

/** Loads the "expenses" message catalog for `language`. */
export async function loadExpensesMessages(language: Language): Promise<ExpensesTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
