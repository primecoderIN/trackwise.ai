// The public Terms of Service page at "/terms-of-service" (English), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicLegalPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English terms of service page, with hreflang alternate to /hi/terms-of-service. */
export const metadata: Metadata = publicPage(texts.termsPage.title, ROUTES.terms, {
  description: texts.termsPage.metaDescription,
  languages: { en: ROUTES.terms, hi: ROUTES.termsHi },
})

/** The English Terms of Service page. */
export default function TermsRoute() {
  return <PublicLegalPage texts={texts} kind="terms" />
}
