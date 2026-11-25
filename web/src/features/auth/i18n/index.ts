// The "auth" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("auth")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "auth" message catalog. */
export type AuthTexts = typeof en

/** A text explaining why a sign-in failed: its key under "failures". */
export type FailureText = keyof typeof en.failures

/** Loads the "auth" message catalog for `language`. */
export async function loadAuthMessages(language: Language): Promise<AuthTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
