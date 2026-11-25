"use client"

// Error boundary for `[lang]` public and sign-in routes. Renders in the route's active locale without importing only
// English statically.

import { RefreshCw } from "lucide-react"
import { useLocale } from "next-intl"
import { useEffect } from "react"

import appEn from "@/app/_i18n/en"
import appHi from "@/app/_i18n/hi"
import { PublicLink } from "@/i18n/navigation"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import commonEn from "@/shared/i18n/common/en"
import commonHi from "@/shared/i18n/common/hi"
import { DEFAULT_LANGUAGE, isLanguage } from "@/shared/i18n/languages"
import { reportUnexpected, UserFacingError } from "@/shared/lib/errors"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

/** Route segment error UI for `[lang]` routes. */
export default function LocalizedError({ error, retry }: { error: unknown; retry: () => void }) {
  const rawLocale = useLocale()
  const lang = isLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE
  const appTexts = lang === "hi" ? appHi : appEn
  const commonTexts = lang === "hi" ? commonHi : commonEn

  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  const title = appTexts.errors.app.replace("{{app}}", APP_NAME)
  const message = error instanceof UserFacingError ? error.message : commonTexts.errors.unexpected

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
      <Card role="alert">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => retry()}>
            <RefreshCw className="size-4" />
            {commonTexts.retry.tryAgain}
          </Button>
          <Button asChild variant="ghost">
            <PublicLink href={ROUTES.landing}>{appTexts.notFound.backLanding}</PublicLink>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
