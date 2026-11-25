// The "common" namespace: the texts shared/ shows, typed by en.ts and loaded via next-intl (`useTranslations("common")`).

import type { Language } from "../languages"
import en from "./en"

/** The shape of the common texts (its keys), for code that names one by a variable. */
export type CommonTexts = typeof en

/** Loads the "common" message catalog for `language`. */
export async function loadCommonMessages(language: Language): Promise<CommonTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
