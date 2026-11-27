// The public pages' list for search engines: /sitemap.xml, served by Next.js from this file (Phase 29). Part of the
// app composition (app/). Lists every localized public page across all supported languages with hreflang alternates.

import type { MetadataRoute } from "next"

import { localizedPath, ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES } from "@/shared/i18n/languages"

import { alternateLanguagesFor, LOCALIZED_PUBLIC_ROUTES, siteUrl } from "./_seo/seo"

const LAST_MODIFIED = new Date("2026-11-27T00:00:00.000Z")

function crawlSignals(basePath: string): {
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
} {
  if (basePath === ROUTES.landing) return { changeFrequency: "weekly", priority: 1.0 }
  if (basePath === ROUTES.howItWorks || basePath === ROUTES.features) {
    return { changeFrequency: "weekly", priority: 0.9 }
  }
  if (basePath === ROUTES.faq) return { changeFrequency: "monthly", priority: 0.8 }
  if (basePath === ROUTES.contact) return { changeFrequency: "monthly", priority: 0.7 }
  return { changeFrequency: "yearly", priority: 0.3 }
}

/** sitemap.xml: every public page in every supported language with hreflang alternates (`x-default`). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  return LOCALIZED_PUBLIC_ROUTES.flatMap((route) => {
    const { changeFrequency, priority } = crawlSignals(route)
    const languages = alternateLanguagesFor(route, base)
    return LANGUAGE_CODES.map((lang) => ({
      url: new URL(localizedPath(route, lang), base).toString(),
      lastModified: LAST_MODIFIED,
      changeFrequency,
      priority,
      alternates: { languages },
    }))
  })
}
