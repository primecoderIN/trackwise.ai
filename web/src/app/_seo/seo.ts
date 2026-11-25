// What search engines and link previews are told about each page: the site's address, the default title and
// description, which pages may be indexed, hreflang alternates across all supported languages, and Google Search
// Console verification (D188, Phase 29). Part of the app composition (app/_seo/), server side only.

import type { Metadata, Viewport } from "next"

import { APP_DESCRIPTION, APP_NAME } from "@/shared/config/app"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { DEFAULT_PUBLIC_URL, PUBLIC_URL_SETTING } from "@/shared/config/site"
import { DEFAULT_LANGUAGE, LANGUAGE_CODES, openGraphLocale, type Language } from "@/shared/i18n/languages"

// Optional environment variable for Google Search Console verification (<meta name="google-site-verification" ...>).
const GOOGLE_SITE_VERIFICATION_SETTING = "GOOGLE_SITE_VERIFICATION"

/** Base public route paths that are localized across every supported language (`[lang]`). */
export const LOCALIZED_PUBLIC_ROUTES: readonly string[] = [
  ROUTES.landing,
  ROUTES.howItWorks,
  ROUTES.features,
  ROUTES.faq,
  ROUTES.contact,
  ROUTES.privacy,
  ROUTES.terms,
  ROUTES.signIn,
]

/**
 * Every localized public URL path (used in sitemap.xml). Generated dynamically from `LANGUAGE_CODES`.
 */
export const PUBLIC_PATHS: readonly string[] = LOCALIZED_PUBLIC_ROUTES.flatMap((route) =>
  LANGUAGE_CODES.map((lang) => localizedPath(route, lang)),
)

/** Shared viewport and responsive theme colors for both public and workspace root layouts. */
export const SITE_VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

/**
 * The site's origin, e.g. https://trackwise.ai: PUBLIC_URL (shared/config/site.ts), else the development address.
 * Canonical URLs, the sitemap and link previews are built on it.
 */
export function siteUrl(): URL {
  return new URL(process.env[PUBLIC_URL_SETTING] || DEFAULT_PUBLIC_URL)
}

const DEFAULT_KEYWORDS: Record<Language, readonly string[]> = {
  en: [
    "AI expense tracker",
    "receipt scanner app",
    "personal expense manager",
    "monthly budget tracker",
    "spending insights",
    "bilingual budget app",
    APP_NAME,
  ],
  hi: ["AI खर्च ट्रैकर", "रसीद स्कैनर ऐप", "मासिक बजट प्लानर", "दैनिक खर्च हिसाब", "व्यक्तिगत वित्त ट्रैकर", APP_NAME],
}

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

/** Builds the `hreflang` alternates map (`en`, `hi`, `x-default`) for a base public route path. */
export function alternateLanguagesFor(basePath: string, origin?: URL): Record<string, string> {
  const entries = LANGUAGE_CODES.map((code) => {
    const path = localizedPath(basePath, code)
    return [code, origin ? new URL(path, origin).toString() : path] as const
  })
  const defaultPath = localizedPath(basePath, DEFAULT_LANGUAGE)
  return {
    ...Object.fromEntries(entries),
    "x-default": origin ? new URL(defaultPath, origin).toString() : defaultPath,
  }
}

/**
 * The metadata every page starts from (the root layouts'): the site's address, the title (a page's own title
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
    keywords: [...DEFAULT_KEYWORDS[DEFAULT_LANGUAGE]],
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
      locale: openGraphLocale(DEFAULT_LANGUAGE),
      alternateLocale: LANGUAGE_CODES.filter((code) => code !== DEFAULT_LANGUAGE).map(openGraphLocale),
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
 * optional page-specific keywords, and hreflang language alternates across every supported language.
 */
export function publicPage(
  title: string,
  basePath: string,
  options?: { lang?: Language; description?: string; keywords?: readonly string[] },
): Metadata {
  const lang = options?.lang ?? DEFAULT_LANGUAGE
  const canonicalPath = localizedPath(basePath, lang)
  const description = options?.description ?? APP_DESCRIPTION
  return {
    title,
    description,
    keywords: options?.keywords ? [...options.keywords] : [...DEFAULT_KEYWORDS[lang]],
    robots: INDEXABLE_ROBOTS,
    alternates: {
      canonical: canonicalPath,
      languages: alternateLanguagesFor(basePath),
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale(lang),
      alternateLocale: LANGUAGE_CODES.filter((code) => code !== lang).map(openGraphLocale),
      siteName: APP_NAME,
      title,
      description,
      url: canonicalPath,
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
