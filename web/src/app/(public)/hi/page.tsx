// The public Landing page at "/hi" (Hindi), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicLandingPage } from "@/app/_public/components/landing-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi landing page, with hreflang alternate to /. */
export const metadata: Metadata = publicPage(texts.landing.title, ROUTES.landingHi, {
  description: texts.landing.metaDescription,
  languages: { en: ROUTES.landing, hi: ROUTES.landingHi },
})

/** The Hindi public landing page. */
export default function HindiLandingRoute() {
  return <PublicLandingPage texts={texts} />
}
