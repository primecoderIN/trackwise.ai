// next-intl routing definition for localized public routes (and `/sign-in`). Keeps clean unprefixed URLs for
// English (`localePrefix: "as-needed"`) and `/hi/...` for Hindi, matching D220 SEO URLs without duplicating route trees.

import { defineRouting } from "next-intl/routing"

import { DEFAULT_LANGUAGE, LANGUAGE_CODES } from "@/shared/i18n/languages"

/** Shared next-intl routing config used by `src/proxy.ts` and `@/i18n/navigation`. */
export const routing = defineRouting({
  locales: LANGUAGE_CODES,
  defaultLocale: DEFAULT_LANGUAGE,
  localePrefix: "as-needed",
  // Public SEO URLs follow their URL segment strictly (so `/` always renders English even if the user chose Hindi in-app).
  localeDetection: false,
  localeCookie: false,
})
