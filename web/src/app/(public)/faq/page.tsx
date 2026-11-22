// The public FAQ page at "/faq" (English), rendered on the server with FAQPage JSON-LD (Phase 29).

import type { Metadata } from "next"

import { PublicFaqPage } from "@/app/_public/components/faq-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"

const texts = getPublicSiteTexts("en")

/** Metadata for the English FAQ page, with hreflang alternate to /hi/faq. */
export const metadata: Metadata = publicPage(texts.faqPage.title, ROUTES.faq, {
  description: texts.faqPage.metaDescription,
  keywords: texts.faqPage.keywords,
  languages: { en: ROUTES.faq, hi: ROUTES.faqHi },
})

/** The English categorized FAQ page. */
export default function FaqRoute() {
  return <PublicFaqPage texts={texts} />
}
