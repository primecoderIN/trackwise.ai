// The public Contact & Support page at "/contact" (English), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicContactPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English contact page, with hreflang alternate to /hi/contact. */
export const metadata: Metadata = publicPage(texts.contactPage.title, ROUTES.contact, {
  description: texts.contactPage.metaDescription,
  keywords: texts.contactPage.keywords,
  languages: { en: ROUTES.contact, hi: ROUTES.contactHi },
})

/** The English global Support and Privacy Requests page. */
export default function ContactRoute() {
  return <PublicContactPage texts={texts} />
}
