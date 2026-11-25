// The languages the app speaks, and what each one needs besides its texts: how it writes numbers and dates, its
// writing direction, and its date picker locale. Part of shared/i18n. Read by next-intl request/routing setup, the
// language menu, and useFormatters(), so adding a language is one entry here plus its text file in each namespace.

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

/** Cookie storing the user's preferred app UI language so Next.js Server Components can SSR in that locale. */
export const LOCALE_COOKIE = "NEXT_LOCALE"

/** Request header used for language negotiation (RFC 9110). */
export const ACCEPT_LANGUAGE = "Accept-Language"

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Whether a value (a saved choice, a browser language) is one of LANGUAGES' codes, exactly. */
export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && Object.hasOwn(LANGUAGES, value)
}

// Resolves one language tag ("hi-IN" or "en-US") against LANGUAGES: exact match first, then base subtag.
function matchTag(tag: string): Language | undefined {
  const wanted = tag.trim().toLowerCase()
  if (!wanted || wanted === "*") return undefined
  const base = wanted.split("-")[0]
  return (
    LANGUAGE_CODES.find((code) => code.toLowerCase() === wanted) ??
    LANGUAGE_CODES.find((code) => code.toLowerCase() === base)
  )
}

/**
 * Negotiates a supported `Language` from an HTTP `Accept-Language` header (RFC 9110 q-values supported),
 * falling back to DEFAULT_LANGUAGE when absent or unmatched.
 */
export function matchLanguageHeader(header: string | null | undefined): Language {
  if (!header) return DEFAULT_LANGUAGE
  const weighted = header
    .split(",")
    .map((entry, index) => {
      const [rawTag, ...params] = entry.split(";")
      const qParam = params.find((param) => param.trim().toLowerCase().startsWith("q="))
      const qValue = qParam ? Number(qParam.trim().slice(2)) : 1
      return { tag: rawTag.trim(), q: Number.isFinite(qValue) ? qValue : 0, index }
    })
    .filter((item) => item.q > 0 && item.tag !== "")
    .sort((a, b) => b.q - a.q || a.index - b.index)

  for (const item of weighted) {
    const matched = matchTag(item.tag)
    if (matched) return matched
  }
  return DEFAULT_LANGUAGE
}

/** OpenGraph `locale` format (`en_US`, `hi_IN`) derived from the configured BCP 47 locale. */
export function openGraphLocale(language: Language): string {
  return LANGUAGES[language].locale.replace("-", "_")
}

/** Persists the selected app locale in an SSR-readable cookie for future requests. */
export function setLocaleCookie(language: Language): void {
  if (typeof document === "undefined") return
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${LOCALE_COOKIE}=${language}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`
}
