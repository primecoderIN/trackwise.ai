// The public pages' list for search engines: /sitemap.xml, served by Next.js from this file (Phase 29). Part of the
// app composition (app/). Lists every public page in both English and Hindi with hreflang alternates and lastModified.

import type { MetadataRoute } from "next"

import { PUBLIC_PAGE_PAIRS, PUBLIC_PATHS, siteUrl } from "./_seo/seo"

const LAST_MODIFIED = new Date("2026-11-21T00:00:00.000Z")

/** sitemap.xml: every public page at its full address, with bilingual hreflang alternates where available. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const pairByPath = new Map<string, { en: string; hi: string }>()
  for (const pair of PUBLIC_PAGE_PAIRS) {
    pairByPath.set(pair.en, pair)
    pairByPath.set(pair.hi, pair)
  }

  return PUBLIC_PATHS.map((path) => {
    const pair = pairByPath.get(path)
    return {
      url: new URL(path, base).toString(),
      lastModified: LAST_MODIFIED,
      ...(pair
        ? {
            alternates: {
              languages: {
                en: new URL(pair.en, base).toString(),
                hi: new URL(pair.hi, base).toString(),
              },
            },
          }
        : {}),
    }
  })
}
