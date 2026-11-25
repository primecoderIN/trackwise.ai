// Root layout for all localized `[lang]` public marketing and sign-in routes (`/` and `/hi/...`).
// Sets `<html lang>` and `<html dir>` on the server, enables static generation via `generateStaticParams` +
// `setRequestLocale`, and provides `NextIntlClientProvider` with `{ locale }` (zero marketing text payload).

import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import type { ReactNode } from "react"

import { SITE_VIEWPORT, siteMetadata } from "@/app/_seo/seo"
import { BOOT_MESSAGE_NAMESPACES, pickMessages } from "@/i18n/messages"
import { isLanguage, LANGUAGE_CODES, LANGUAGES } from "@/shared/i18n/languages"
import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-constants"

import "../_styles/index.css"

/** Shared base metadata for public routes. */
export const metadata: Metadata = siteMetadata()

/** Responsive viewport and theme colors. */
export const viewport: Viewport = SITE_VIEWPORT

/** Pre-generates static `[lang]` variants for every supported language (`en`, `hi`). */
export function generateStaticParams() {
  return LANGUAGE_CODES.map((lang) => ({ lang }))
}

/** Root HTML document for `[lang]` public routes. */
export default async function LocalizedLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  const messages = await getMessages()

  return (
    <html lang={lang} dir={LANGUAGES[lang].dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider locale={lang} messages={pickMessages(messages, BOOT_MESSAGE_NAMESPACES)}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
