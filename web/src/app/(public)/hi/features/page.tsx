// The public Features tour page at "/hi/features" (Hindi), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicFeaturesPage } from "@/app/_public/components/features-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi Features page, with hreflang alternate to /features. */
export const metadata: Metadata = publicPage(texts.featuresPage.title, ROUTES.featuresHi, {
  description: texts.featuresPage.metaDescription,
  keywords: texts.featuresPage.keywords,
  languages: { en: ROUTES.features, hi: ROUTES.featuresHi },
})

/** The Hindi Features tour page. */
export default function HindiFeaturesRoute() {
  return <PublicFeaturesPage texts={texts} />
}
