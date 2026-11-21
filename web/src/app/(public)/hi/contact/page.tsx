// The public Contact and DPDP Grievance page at "/hi/contact" (Hindi), rendered on the server (Phase 29).

import type { Metadata } from "next"

import { PublicContactPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi contact page, with hreflang alternate to /contact. */
export const metadata: Metadata = publicPage(texts.contactPage.title, ROUTES.contactHi, {
  description: texts.contactPage.metaDescription,
  languages: { en: ROUTES.contact, hi: ROUTES.contactHi },
})

/** The Hindi Contact and DPDP Grievance page. */
export default function HindiContactRoute() {
  return <PublicContactPage texts={texts} />
}
