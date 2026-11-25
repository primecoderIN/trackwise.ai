// The public Privacy Policy page (`/privacy-policy` and `/hi/privacy-policy`), rendered on the server.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { PublicLegalPage } from "@/app/_public/components/legal-pages"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage } from "@/shared/i18n/languages"

/** Localized metadata and hreflang alternates for the Privacy Policy page. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}
  const texts = await getPublicSiteTexts(lang)
  return publicPage(texts.privacyPage.title, ROUTES.privacy, {
    lang,
    description: texts.privacyPage.metaDescription,
  })
}

/** Server-rendered Privacy Policy page. */
export default async function PrivacyRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  const texts = await getPublicSiteTexts(lang)
  return <PublicLegalPage texts={texts} kind="privacy" />
}
