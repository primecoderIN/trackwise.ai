// The "splits" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("splits")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "splits" message catalog. */
export type SplitsTexts = typeof en

/** Loads the "splits" message catalog for `language`. */
export async function loadSplitsMessages(language: Language): Promise<SplitsTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
