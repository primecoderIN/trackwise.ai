// The "categories" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("categories")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "categories" message catalog. */
export type CategoriesTexts = typeof en

/** Loads the "categories" message catalog for `language`. */
export async function loadCategoriesMessages(language: Language): Promise<CategoriesTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
