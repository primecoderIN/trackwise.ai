// What search engines and link previews are told about each page: the site's address, the default title and
// description, which pages may be indexed, hreflang alternates between English and Hindi, and Google Search Console
// verification (D188, Phase 29). Part of the app composition (app/_seo/), server side only.

import type { Metadata } from "next"

import { APP_DESCRIPTION, APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { DEFAULT_PUBLIC_URL, PUBLIC_URL_SETTING } from "@/shared/config/site"

// Optional environment variable for Google Search Console verification (<meta name="google-site-verification" ...>).
const GOOGLE_SITE_VERIFICATION_SETTING = "GOOGLE_SITE_VERIFICATION"

/** Bilingual pairs of public pages (English and Hindi) for hreflang alternates and the sitemap. */
export const PUBLIC_PAGE_PAIRS: readonly { en: string; hi: string }[] = [
  { en: ROUTES.landing, hi: ROUTES.landingHi },
  { en: ROUTES.features, hi: ROUTES.featuresHi },
  { en: ROUTES.security, hi: ROUTES.securityHi },
  { en: ROUTES.faq, hi: ROUTES.faqHi },
  { en: ROUTES.privacy, hi: ROUTES.privacyHi },
  { en: ROUTES.terms, hi: ROUTES.termsHi },
  { en: ROUTES.contact, hi: ROUTES.contactHi },
]

/**
 * The pages anyone may visit without signing in, in the order search engines should see them: robots.txt allows
 * them and the sitemap lists them. Each one's route file uses publicPage.
 */
export const PUBLIC_PATHS: readonly string[] = [
  ROUTES.landing,
  ROUTES.landingHi,
  ROUTES.features,
  ROUTES.featuresHi,
  ROUTES.security,
  ROUTES.securityHi,
  ROUTES.faq,
  ROUTES.faqHi,
  ROUTES.privacy,
  ROUTES.privacyHi,
  ROUTES.terms,
  ROUTES.termsHi,
  ROUTES.contact,
  ROUTES.contactHi,
  ROUTES.signIn,
]

/**
 * The site's origin, e.g. https://spendwise.example: PUBLIC_URL (shared/config/site.ts), else the development address.
 * Canonical URLs, the sitemap and link previews are built on it.
 */
export function siteUrl(): URL {
  return new URL(process.env[PUBLIC_URL_SETTING] || DEFAULT_PUBLIC_URL)
}

/**
 * The metadata every page starts from (the root layout's): the site's address, the title (a page's own title
 * becomes "<title> | SpendWise"), the description, the icon, the link preview, and optional Search Console verification.
 */
export function siteMetadata(): Metadata {
  const googleVerification = process.env[GOOGLE_SITE_VERIFICATION_SETTING]?.trim()
  return {
    metadataBase: siteUrl(),
    title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
    description: APP_DESCRIPTION,
    applicationName: APP_NAME,
    icons: { icon: "/favicon.svg" },
    openGraph: { type: "website", siteName: APP_NAME, title: APP_NAME, description: APP_DESCRIPTION },
    twitter: { card: "summary_large_image", title: APP_NAME, description: APP_DESCRIPTION },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  }
}

/**
 * A public page's metadata: indexed, under its own title, description, canonical address, Open Graph & X card tags,
 * and optional hreflang language alternates (`en`, `hi`, `x-default`).
 */
export function publicPage(
  title: string,
  path: string,
  options?: { description?: string; languages?: { en: string; hi: string } },
): Metadata {
  const description = options?.description ?? APP_DESCRIPTION
  const languages = options?.languages
    ? { en: options.languages.en, hi: options.languages.hi, "x-default": options.languages.en }
    : undefined
  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      title,
      description,
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

/**
 * A signed-in page's metadata: its title for the browser tab, and kept out of search engines. A crawler never signs
 * in, so all it would ever find there is a redirect to the sign-in page.
 */
export function privatePage(title: string): Metadata {
  return { title, robots: { index: false, follow: false } }
}
