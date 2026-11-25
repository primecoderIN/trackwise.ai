// The "dashboard" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("dashboard")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "dashboard" message catalog. */
export type DashboardTexts = typeof en

/** Loads the "dashboard" message catalog for `language`. */
export async function loadDashboardMessages(language: Language): Promise<DashboardTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
