"use client"

// Next.js's global error boundary (app/global-error.tsx, Phase 28), replacing the root layout if it crashes. Defines
// its own <html> and <body> with the theme boot script and global styles as required by Next.js 16.

import { useEffect } from "react"

import en from "@/app/_i18n/en"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { messageOf, reportUnexpected } from "@/shared/lib/errors"
import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-constants"

import "./_styles/index.css"

/** Global document fallback when the root layout itself fails. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  const title = en.errors.app.replace("{{app}}", APP_NAME)

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{title}</title>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
          <div role="alert" className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{messageOf(error)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => retry()}
                className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent"
              >
                Try again
              </button>
              <a
                href={ROUTES.dashboard}
                className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium hover:bg-accent"
              >
                {en.errors.backHome}
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
