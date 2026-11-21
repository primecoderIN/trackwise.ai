// The public Security & Trust Center page at "/security" (English), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicSecurityPage } from "@/app/_public/components/security-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English Security & Trust page, with hreflang alternate to /hi/security. */
export const metadata: Metadata = publicPage(texts.securityPage.title, ROUTES.security, {
  description: texts.securityPage.metaDescription,
  languages: { en: ROUTES.security, hi: ROUTES.securityHi },
})

/** The English Security & Trust Center page. */
export default function SecurityRoute() {
  return <PublicSecurityPage texts={texts} />
}
