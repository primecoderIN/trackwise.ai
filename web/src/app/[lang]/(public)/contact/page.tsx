// The public Contact & Support page (`/contact` and `/hi/contact`), rendered on the server.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { PublicContactPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage } from "@/shared/i18n/languages"

/** Localized metadata and hreflang alternates for Contact. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}
  const texts = await getPublicSiteTexts(lang)
  return publicPage(texts.contactPage.title, ROUTES.contact, {
    lang,
    description: texts.contactPage.metaDescription,
    keywords: texts.contactPage.keywords,
  })
}

/** Server-rendered Contact & Privacy Requests page. */
export default async function ContactRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  const texts = await getPublicSiteTexts(lang)
  return <PublicContactPage texts={texts} />
}
