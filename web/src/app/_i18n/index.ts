// The "app" namespace: the texts of the app's frame, typed by en.ts and loaded per request via next-intl.

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "app" message catalog. */
export type AppTexts = typeof en

/** A page's name: its key under "pages". */
export type PageName = keyof typeof en.pages

/** Loads the "app" message catalog for `language`. */
export async function loadAppNamespace(language: Language): Promise<AppTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
