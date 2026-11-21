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
 * The site's origin, e.g. https://trackwise.ai: PUBLIC_URL (shared/config/site.ts), else the development address.
 * Canonical URLs, the sitemap and link previews are built on it.
 */
export function siteUrl(): URL {
  return new URL(process.env[PUBLIC_URL_SETTING] || DEFAULT_PUBLIC_URL)
}

const EN_KEYWORDS = [
  "AI expense tracker",
  "receipt scanner",
  "personal finance India",
  "monthly budget tracker",
  "multi-currency expense tracker INR",
  "MCP expense tools",
  APP_NAME,
]

const HI_KEYWORDS = ["AI खर्च ट्रैकर", "रसीद स्कैनर", "मासिक बजट ऐप", "दैनिक खर्च हिसाब", "हिन्दी बजट ट्रैकर", APP_NAME]

const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
}

/**
 * The metadata every page starts from (the root layout's): the site's address, the title (a page's own title
 * becomes "<title> | trackwise.ai"), the description, icons, OpenGraph defaults, and Search Console verification.
 */
export function siteMetadata(): Metadata {
  const googleVerification = process.env[GOOGLE_SITE_VERIFICATION_SETTING]?.trim()
  return {
    metadataBase: siteUrl(),
    title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
    description: APP_DESCRIPTION,
    applicationName: APP_NAME,
    category: "Finance",
    keywords: EN_KEYWORDS,
    authors: [{ name: APP_NAME }],
    creator: APP_NAME,
    publisher: APP_NAME,
    formatDetection: { email: false, address: false, telephone: false },
    robots: INDEXABLE_ROBOTS,
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icon", type: "image/png", sizes: "32x32" },
      ],
      apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      alternateLocale: ["hi_IN"],
      siteName: APP_NAME,
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: APP_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: ["/opengraph-image"],
    },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  }
}

/**
 * A public page's metadata: indexed with rich snippets, canonical URL, Open Graph & X card images, locale tags,
 * and optional hreflang language alternates (`en`, `hi`, `x-default`).
 */
export function publicPage(
  title: string,
  path: string,
  options?: { description?: string; languages?: { en: string; hi: string } },
): Metadata {
  const description = options?.description ?? APP_DESCRIPTION
  const isHindi = path === ROUTES.landingHi || path.startsWith(`${ROUTES.landingHi}/`)
  const languages = options?.languages
    ? { en: options.languages.en, hi: options.languages.hi, "x-default": options.languages.en }
    : undefined
  return {
    title,
    description,
    keywords: isHindi ? HI_KEYWORDS : EN_KEYWORDS,
    robots: INDEXABLE_ROBOTS,
    alternates: {
      canonical: path,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      type: "website",
      locale: isHindi ? "hi_IN" : "en_IN",
      alternateLocale: [isHindi ? "en_IN" : "hi_IN"],
      siteName: APP_NAME,
      title,
      description,
      url: path,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${title} — ${APP_NAME}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
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
