// Per-request i18n configuration for next-intl. Resolves the active locale from the `[lang]` route segment (static-safe
// when paired with `setRequestLocale`) or falls back to the `NEXT_LOCALE` cookie and `Accept-Language` header for
// unprefixed signed-in `(app)` routes.

import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { ACCEPT_LANGUAGE, isLanguage, LOCALE_COOKIE, matchLanguageHeader } from "@/shared/i18n/languages"

/** Resolves the active request locale for Server Components, metadata generation, and NextIntlClientProvider. */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  if (isLanguage(requested)) {
    return { locale: requested, messages: {} }
  }

  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLanguage(fromCookie) ? fromCookie : matchLanguageHeader((await headers()).get(ACCEPT_LANGUAGE))

  return { locale, messages: {} }
})
