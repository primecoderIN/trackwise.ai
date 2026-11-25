// The "account" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("account")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "account" message catalog. */
export type AccountTexts = typeof en

/** Loads the "account" message catalog for `language`. */
export async function loadAccountMessages(language: Language): Promise<AccountTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
