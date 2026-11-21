// The public Privacy Policy page at "/hi/privacy-policy" (Hindi), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicLegalPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi privacy policy page, with hreflang alternate to /privacy-policy. */
export const metadata: Metadata = publicPage(texts.privacyPage.title, ROUTES.privacyHi, {
  description: texts.privacyPage.metaDescription,
  languages: { en: ROUTES.privacy, hi: ROUTES.privacyHi },
})

/** The Hindi Privacy Policy page. */
export default function HindiPrivacyRoute() {
  return <PublicLegalPage texts={texts} kind="privacy" />
}
