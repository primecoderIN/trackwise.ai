"use client"

// Next.js's global error boundary (app/global-error.tsx), replacing the root layout if it crashes. Defines
// its own `<html>` and `<body>` safely outside `NextIntlClientProvider`, choosing locale from the document or cookie.

import { useEffect, useSyncExternalStore } from "react"

import appEn from "@/app/_i18n/en"
import appHi from "@/app/_i18n/hi"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import commonEn from "@/shared/i18n/common/en"
import commonHi from "@/shared/i18n/common/hi"
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES, type Language } from "@/shared/i18n/languages"
import { formatErrorTemplate, messageOf, reportUnexpected } from "@/shared/lib/errors"
import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-constants"

import "./_styles/index.css"

const NOOP_UNSUBSCRIBE = () => {}
const subscribeDocument = () => NOOP_UNSUBSCRIBE

function browserLanguage(): Language {
  if (typeof document === "undefined") return DEFAULT_LANGUAGE
  const docLang = document.documentElement.lang
  return isLanguage(docLang) ? docLang : DEFAULT_LANGUAGE
}

function serverLanguage(): Language {
  return DEFAULT_LANGUAGE
}

/** Global document fallback when the root layout itself fails. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const lang = useSyncExternalStore<Language>(subscribeDocument, browserLanguage, serverLanguage)

  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  const appTexts = lang === "hi" ? appHi : appEn
  const commonTexts = lang === "hi" ? commonHi : commonEn
  const title = formatErrorTemplate(appTexts.errors.app, { app: APP_NAME })
  const description = messageOf(error, (key, values) => formatErrorTemplate(commonTexts.errors[key], values))

  return (
    <html lang={lang} dir={LANGUAGES[lang].dir} suppressHydrationWarning>
      <head>
        <title>{title}</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
          <div role="alert" className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => retry()}
                className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"
              >
                {commonTexts.retry.tryAgain}
              </button>
              <a
                href={ROUTES.dashboard}
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-accent"
              >
                {appTexts.errors.backHome}
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
