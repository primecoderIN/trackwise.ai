// The public Privacy Policy page at "/privacy-policy" (English), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicLegalPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English privacy policy page, with hreflang alternate to /hi/privacy-policy. */
export const metadata: Metadata = publicPage(texts.privacyPage.title, ROUTES.privacy, {
  description: texts.privacyPage.metaDescription,
  languages: { en: ROUTES.privacy, hi: ROUTES.privacyHi },
})

/** The English Privacy Policy page. */
export default function PrivacyRoute() {
  return <PublicLegalPage texts={texts} kind="privacy" />
}
