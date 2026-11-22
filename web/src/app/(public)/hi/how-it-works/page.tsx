// The public How It Works page at "/hi/how-it-works" (Hindi), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicHowItWorksPage } from "@/app/_public/components/how-it-works-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi How It Works page, with distinct copy and hreflang alternate to /how-it-works. */
export const metadata: Metadata = publicPage(texts.howItWorksPage.title, ROUTES.howItWorksHi, {
  description: texts.howItWorksPage.metaDescription,
  keywords: texts.howItWorksPage.keywords,
  languages: { en: ROUTES.howItWorks, hi: ROUTES.howItWorksHi },
})

/** The Hindi How It Works workflow page. */
export default function HindiHowItWorksRoute() {
  return <PublicHowItWorksPage texts={texts} />
}
