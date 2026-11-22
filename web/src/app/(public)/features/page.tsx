// The public Features tour page at "/features" (English), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicFeaturesPage } from "@/app/_public/components/features-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English Features page, with hreflang alternate to /hi/features. */
export const metadata: Metadata = publicPage(texts.featuresPage.title, ROUTES.features, {
  description: texts.featuresPage.metaDescription,
  keywords: texts.featuresPage.keywords,
  languages: { en: ROUTES.features, hi: ROUTES.featuresHi },
})

/** The English Features tour page. */
export default function FeaturesRoute() {
  return <PublicFeaturesPage texts={texts} />
}
