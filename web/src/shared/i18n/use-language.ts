"use client"

// Hook for components needing active locale metadata, the date-picker locale, or imperative language switching.
// Reads the active locale from next-intl, persists NEXT_LOCALE cookie on changes, and refreshes or navigates.

import { useParams, usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import type { DayPickerLocale } from "react-day-picker"

import { localizedPath, ROUTES } from "@/shared/config/routes"

import { syncLegacyLanguage } from "./i18n"
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES, setLocaleCookie, type Language } from "./languages"

const cachedPickerLocales = new Map<Language, DayPickerLocale>()

async function ensureDatePickerLocale(language: Language): Promise<DayPickerLocale | undefined> {
  const cached = cachedPickerLocales.get(language)
  if (cached) return cached
  const loaded = await LANGUAGES[language].loadDatePickerLocale().catch(() => undefined)
  if (loaded) cachedPickerLocales.set(language, loaded)
  return loaded
}

function unprefixedPath(pathname: string, routeLang: Language): string {
  const prefix = `/${routeLang}`
  if (pathname === prefix) return ROUTES.landing
  return pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname
}

/** Current locale state, formatting metadata, date picker locale, and async language switcher. */
export interface LanguageState {
  /** The active ISO language code ("en", "hi"). */
  language: Language
  /** Native display name ("हिन्दी"). */
  name: string
  /** The BCP 47 locale tag used for Intl formatting ("hi-IN"). */
  locale: string
  /** Writing direction. */
  dir: "ltr" | "rtl"
  /** Loaded react-day-picker locale object, if available. */
  datePickerLocale: DayPickerLocale | undefined
  /** Switches active locale, updates NEXT_LOCALE cookie, and refreshes/navigates cleanly. */
  setLanguage: (next: Language) => Promise<void>
}

/** Exposes the active next-intl locale, its date-picker locale, and cookie-backed language switcher. */
export function useLanguage(): LanguageState {
  const rawLocale = useLocale()
  const language: Language = isLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<{ lang?: string | string[] }>()
  const [datePickerLocale, setDatePickerLocale] = useState<DayPickerLocale | undefined>(() =>
    cachedPickerLocales.get(language),
  )

  useEffect(() => {
    let active = true
    void ensureDatePickerLocale(language).then((loaded) => {
      if (active) setDatePickerLocale(loaded)
    })
    return () => {
      active = false
    }
  }, [language])

  const rawRouteLang = params?.lang
  const routeLang = typeof rawRouteLang === "string" && isLanguage(rawRouteLang) ? rawRouteLang : undefined

  const setLanguage = useCallback(
    async (next: Language) => {
      await syncLegacyLanguage(next)
      setLocaleCookie(next)
      document.documentElement.lang = next
      document.documentElement.dir = LANGUAGES[next].dir
      if (routeLang) {
        const search = typeof window !== "undefined" ? window.location.search : ""
        router.replace(`${localizedPath(unprefixedPath(pathname, routeLang), next)}${search}`)
        return
      }
      router.refresh()
    },
    [pathname, routeLang, router],
  )

  const { name, locale, dir } = LANGUAGES[language]
  return { language, name, locale, dir, datePickerLocale, setLanguage }
}
