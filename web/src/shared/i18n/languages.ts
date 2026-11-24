// The languages the app speaks, and what each one needs besides its texts: how it writes numbers and dates, its
// writing direction, and its date picker locale. Part of shared/i18n. Read by the i18next setup (i18n.ts), the
// language menu and the formatting helpers (shared/lib/format.ts), so adding a language is one entry here plus its
// text file in each namespace.

import type { DayPickerLocale } from "react-day-picker"

import type { LANGUAGES as SERVER_LANGUAGES } from "@/shared/api/contracts.gen"

// The languages the server writes its texts in (its cards, errors, payment labels), from the generated contract.
type ServerLanguage = (typeof SERVER_LANGUAGES)[number]

/** What the app needs to know about one language. */
export interface LanguageInfo {
  /** The language's name in itself ("हिन्दी"), so people can find their own language in the menu. */
  name: string
  /** The BCP 47 locale numbers, money and dates are written in (Intl): "en-US" groups digits as 125,000. */
  locale: string
  /** Which way its text runs: <html dir> follows it. (Right-to-left layouts aren't supported yet.) */
  dir: "ltr" | "rtl"
  /**
   * Loads the date picker's locale: date-fns's month and weekday names, plus react-day-picker's own screen-reader
   * labels ("Go to the Next Month"). A dynamic import, so only the languages in use are fetched.
   */
  loadDatePickerLocale: () => Promise<DayPickerLocale>
}

/**
 * Every language, by its code (a BCP 47 tag: "en", or "pt-BR" for a regional variant): exactly the server's, so a
 * language the web offers is one the server can write in (a missing or extra one fails the build). English is the
 * language the texts are written in. English uses US conventions for numbers and dates ($125,000.50), while Hindi
 * keeps Indian conventions (₹1,25,000.50).
 */
export const LANGUAGES = {
  en: {
    name: "English",
    locale: "en-US",
    dir: "ltr",
    loadDatePickerLocale: () => import("react-day-picker/locale/en-US").then((module) => module.enUS),
  },
  hi: {
    name: "हिन्दी",
    locale: "hi-IN",
    dir: "ltr",
    loadDatePickerLocale: () => import("react-day-picker/locale/hi").then((module) => module.hi),
  },
} as const satisfies Record<ServerLanguage, LanguageInfo>

/** A language's code: "en" or "hi". */
export type Language = keyof typeof LANGUAGES

/** Every language's code, in menu order. */
export const LANGUAGE_CODES = Object.keys(LANGUAGES) as Language[]

/**
 * The language every text is written in first, and the fallback for any text a translation lacks (it's loaded with
 * every other language). Also what the app speaks when nothing else is chosen and the browser asks for none of
 * LANGUAGES.
 */
export const DEFAULT_LANGUAGE = "en" satisfies Language

/** Where the chosen language is saved in localStorage. */
export const LANGUAGE_STORAGE_KEY = "spendwise-language"

/** Whether a value (a saved choice, a browser language) is one of LANGUAGES' codes, exactly. */
export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && Object.hasOwn(LANGUAGES, value)
}

/**
 * The language to start in: the one previously saved in localStorage; otherwise DEFAULT_LANGUAGE ("en") so first-run
 * onboarding starts predictably in English. Never throws if storage is blocked.
 */
export function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // Storage blocked: fall back to DEFAULT_LANGUAGE.
  }
  return DEFAULT_LANGUAGE
}
