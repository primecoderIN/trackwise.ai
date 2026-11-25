// The public Features tour page (`/features` and `/hi/features`), rendered on the server.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { PublicFeaturesPage } from "@/app/_public/components/features-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage } from "@/shared/i18n/languages"

/** Localized metadata and hreflang alternates for Features. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}
  const texts = await getPublicSiteTexts(lang)
  return publicPage(texts.featuresPage.title, ROUTES.features, {
    lang,
    description: texts.featuresPage.metaDescription,
    keywords: texts.featuresPage.keywords,
  })
}

/** Server-rendered Features tour page. */
export default async function FeaturesRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  const texts = await getPublicSiteTexts(lang)
  return <PublicFeaturesPage texts={texts} />
}
