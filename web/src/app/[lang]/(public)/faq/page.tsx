// The public FAQ page (`/faq` and `/hi/faq`), rendered on the server with FAQPage JSON-LD.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { PublicFaqPage } from "@/app/_public/components/faq-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage } from "@/shared/i18n/languages"

/** Localized metadata and hreflang alternates for the FAQ page. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}
  const texts = await getPublicSiteTexts(lang)
  return publicPage(texts.faqPage.title, ROUTES.faq, {
    lang,
    description: texts.faqPage.metaDescription,
    keywords: texts.faqPage.keywords,
  })
}

/** Server-rendered categorized FAQ page. */
export default async function FaqRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  const texts = await getPublicSiteTexts(lang)
  return <PublicFaqPage texts={texts} />
}
