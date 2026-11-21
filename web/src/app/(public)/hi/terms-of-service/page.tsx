// The public Terms of Service page at "/hi/terms-of-service" (Hindi), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicLegalPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi terms of service page, with hreflang alternate to /terms-of-service. */
export const metadata: Metadata = publicPage(texts.termsPage.title, ROUTES.termsHi, {
  description: texts.termsPage.metaDescription,
  languages: { en: ROUTES.terms, hi: ROUTES.termsHi },
})

/** The Hindi Terms of Service page. */
export default function HindiTermsRoute() {
  return <PublicLegalPage texts={texts} kind="terms" />
}
