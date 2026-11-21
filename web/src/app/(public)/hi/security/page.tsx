// The public Security & Trust Center page at "/hi/security" (Hindi), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicSecurityPage } from "@/app/_public/components/security-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi Security & Trust page, with hreflang alternate to /security. */
export const metadata: Metadata = publicPage(texts.securityPage.title, ROUTES.securityHi, {
  description: texts.securityPage.metaDescription,
  languages: { en: ROUTES.security, hi: ROUTES.securityHi },
})

/** The Hindi Security & Trust Center page. */
export default function HindiSecurityRoute() {
  return <PublicSecurityPage texts={texts} />
}
