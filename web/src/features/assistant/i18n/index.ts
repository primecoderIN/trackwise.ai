// The "assistant" namespace: typed by en.ts and loaded per request via next-intl (`useTranslations("assistant")`).

import type { Language } from "@/shared/i18n"

import en from "./en"

/** Shape of the "assistant" message catalog. */
export type AssistantTexts = typeof en

/** Loads the "assistant" message catalog for `language`. */
export async function loadAssistantMessages(language: Language): Promise<AssistantTexts> {
  return language === "hi" ? (await import("./hi")).default : en
}
