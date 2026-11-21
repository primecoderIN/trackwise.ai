// The public FAQ page at "/hi/faq" (Hindi), rendered on the server with FAQPage JSON-LD (Phase 29).

import type { Metadata } from "next"

import { PublicFaqPage } from "@/app/_public/components/faq-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("hi")

/** Metadata for the Hindi FAQ page, with hreflang alternate to /faq. */
export const metadata: Metadata = publicPage(texts.faqPage.title, ROUTES.faqHi, {
  description: texts.faqPage.metaDescription,
  languages: { en: ROUTES.faq, hi: ROUTES.faqHi },
})

/** The Hindi categorized FAQ page. */
export default function HindiFaqRoute() {
  return <PublicFaqPage texts={texts} />
}
