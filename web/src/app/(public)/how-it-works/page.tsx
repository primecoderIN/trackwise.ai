// The public How It Works page at "/how-it-works" (English), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicHowItWorksPage } from "@/app/_public/components/how-it-works-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English How It Works page, with distinct copy and hreflang alternate to /hi/how-it-works. */
export const metadata: Metadata = publicPage(texts.howItWorksPage.title, ROUTES.howItWorks, {
  description: texts.howItWorksPage.metaDescription,
  keywords: texts.howItWorksPage.keywords,
  languages: { en: ROUTES.howItWorks, hi: ROUTES.howItWorksHi },
})

/** The English How It Works workflow page. */
export default function HowItWorksRoute() {
  return <PublicHowItWorksPage texts={texts} />
}
