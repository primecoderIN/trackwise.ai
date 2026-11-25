// The "reports" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("reports")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "reports" message catalog. */
export type ReportsTexts = typeof en

/** Loads the "reports" message catalog for `language`. */
export async function loadReportsMessages(language: Language): Promise<ReportsTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
