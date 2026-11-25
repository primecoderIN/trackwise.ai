// The public Landing page (`/` and `/hi`), rendered on the server with localized HTML, metadata, and JSON-LD.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"

import { PublicLandingPage } from "@/app/_public/components/landing-page"
import { getPublicSiteTexts } from "@/app/_public/texts"
import { publicPage } from "@/app/_seo/seo"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage } from "@/shared/i18n/languages"

/** Localized metadata and hreflang alternates for the landing page. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}
  const texts = await getPublicSiteTexts(lang)
  return publicPage(texts.landing.title, ROUTES.landing, {
    lang,
    description: texts.landing.metaDescription,
    keywords: texts.landing.keywords,
  })
}

/** Server-rendered public landing page in the route's `[lang]`. */
export default async function LandingRoute({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  const texts = await getPublicSiteTexts(lang)
  return <PublicLandingPage texts={texts} />
}
