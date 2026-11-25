// The public How It Works page (`/how-it-works` and `/hi/how-it-works`), rendered on the server.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { PublicHowItWorksPage } from "@/app/_public/components/how-it-works-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage } from "@/shared/i18n/languages"

/** Localized metadata and hreflang alternates for How It Works. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}
  const texts = await getPublicSiteTexts(lang)
  return publicPage(texts.howItWorksPage.title, ROUTES.howItWorks, {
    lang,
    description: texts.howItWorksPage.metaDescription,
    keywords: texts.howItWorksPage.keywords,
  })
}

/** Server-rendered How It Works workflow page. */
export default async function HowItWorksRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  const texts = await getPublicSiteTexts(lang)
  return <PublicHowItWorksPage texts={texts} />
}
