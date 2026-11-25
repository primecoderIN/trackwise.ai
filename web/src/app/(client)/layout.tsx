// Root layout for the browser-side signed-in workspace (`(client)/`).
// Resolves the user's locale on the server (NEXT_LOCALE cookie or Accept-Language), sets `<html lang>` and `dir`,
// provides scoped `next-intl` messages, and renders `ClientRoot`.

import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import type { ReactNode } from "react"

import { SITE_VIEWPORT, siteMetadata } from "@/app/_seo/seo"
import { ClientRoot } from "@/app/_shell/client-root"
import { BOOT_MESSAGE_NAMESPACES, pickMessages } from "@/i18n/messages"
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES } from "@/shared/i18n/languages"
import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-constants"

import "../_styles/index.css"

/** Base site metadata for workspace routes. */
export const metadata: Metadata = siteMetadata()

/** Shared viewport and theme colors. */
export const viewport: Viewport = SITE_VIEWPORT

/** Root HTML document for signed-in workspace pages. */
export default async function ClientLayout({ children }: { children: ReactNode }) {
  const rawLocale = await getLocale()
  const lang = isLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE
  const messages = await getMessages()

  return (
    <html lang={lang} dir={LANGUAGES[lang].dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider locale={lang} messages={pickMessages(messages, BOOT_MESSAGE_NAMESPACES)}>
          <ClientRoot>{children}</ClientRoot>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
