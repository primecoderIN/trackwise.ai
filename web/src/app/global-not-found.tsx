// Global fallback 404 document when an unmatched path bypasses segment layouts (used with `globalNotFound: true`).
// Resolves locale from cookie / Accept-Language so unknown URLs outside `[lang]` still render localized HTML.

import type { Metadata } from "next"
import { cookies, headers } from "next/headers"
import Link from "next/link"

import { localizedPath, ROUTES } from "@/shared/config/routes"
import { ACCEPT_LANGUAGE, isLanguage, LANGUAGES, LOCALE_COOKIE, matchLanguageHeader } from "@/shared/i18n/languages"
import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-constants"

import "./_styles/index.css"

/** Keeps unmatched global 404 responses out of search engines. */
export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
}

/** Global 404 HTML document for requests outside any root layout. */
export default async function GlobalNotFound() {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  const lang = isLanguage(fromCookie) ? fromCookie : matchLanguageHeader((await headers()).get(ACCEPT_LANGUAGE))
  const appTexts = lang === "hi" ? (await import("./_i18n/hi")).default : (await import("./_i18n/en")).default

  return (
    <html lang={lang} dir={LANGUAGES[lang].dir} suppressHydrationWarning>
      <head>
        <title>{appTexts.notFound.title}</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
          <div role="alert" className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-xl font-semibold">{appTexts.notFound.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{appTexts.notFound.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={localizedPath(ROUTES.landing, lang)}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {appTexts.notFound.backLanding}
              </Link>
              <Link
                href={ROUTES.dashboard}
                className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                {appTexts.notFound.backHome}
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
