// The public pages' list for search engines: /sitemap.xml, served by Next.js from this file (Phase 29). Part of the
// app composition (app/). Lists every public page in both English and Hindi with hreflang alternates (including
// x-default), priorities, change frequencies, and lastModified.

import type { MetadataRoute } from "next"

import { ROUTES } from "@/shared/config/routes"

import { PUBLIC_PAGE_PAIRS, PUBLIC_PATHS, siteUrl } from "./_seo/seo"

const LAST_MODIFIED = new Date("2026-11-21T00:00:00.000Z")

function crawlSignals(path: string): {
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
} {
  if (path === ROUTES.landing || path === ROUTES.landingHi) return { changeFrequency: "weekly", priority: 1.0 }
  if (path === ROUTES.features || path === ROUTES.featuresHi) return { changeFrequency: "weekly", priority: 0.9 }
  if (path === ROUTES.faq || path === ROUTES.faqHi || path === ROUTES.security || path === ROUTES.securityHi) {
    return { changeFrequency: "monthly", priority: 0.8 }
  }
  if (path === ROUTES.signIn) return { changeFrequency: "yearly", priority: 0.3 }
  return { changeFrequency: "monthly", priority: 0.5 }
}

/** sitemap.xml: every public page at its full address, with bilingual en/hi/x-default hreflang alternates. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const pairByPath = new Map<string, { en: string; hi: string }>()
  for (const pair of PUBLIC_PAGE_PAIRS) {
    pairByPath.set(pair.en, pair)
    pairByPath.set(pair.hi, pair)
  }

  return PUBLIC_PATHS.map((path) => {
    const pair = pairByPath.get(path)
    const { changeFrequency, priority } = crawlSignals(path)
    return {
      url: new URL(path, base).toString(),
      lastModified: LAST_MODIFIED,
      changeFrequency,
      priority,
      ...(pair
        ? {
            alternates: {
              languages: {
                en: new URL(pair.en, base).toString(),
                hi: new URL(pair.hi, base).toString(),
                "x-default": new URL(pair.en, base).toString(),
              },
            },
          }
        : {}),
    }
  })
}
