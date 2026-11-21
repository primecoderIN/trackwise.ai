// The public Landing page at "/" (English), rendered on the server so search engines index real HTML, headings,
// and JSON-LD structured data (Phase 29, D188). The signed-in Dashboard lives at "/dashboard".

import type { Metadata } from "next"

import { PublicLandingPage } from "@/app/_public/components/landing-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English landing page, with hreflang alternate to /hi. */
export const metadata: Metadata = publicPage(texts.landing.title, ROUTES.landing, {
  description: texts.landing.metaDescription,
  languages: { en: ROUTES.landing, hi: ROUTES.landingHi },
})

/** The English public landing page. */
export default function LandingRoute() {
  return <PublicLandingPage texts={texts} />
}
