"use client"

// Error boundary for `[lang]` public and sign-in routes using `next-intl` translations from `[lang]/layout.tsx`.

import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { PublicLink } from "@/i18n/navigation"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { reportUnexpected } from "@/shared/lib/errors"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

/** Route segment error UI for `[lang]` routes. */
export default function LocalizedError({ error, retry }: { error: unknown; retry: () => void }) {
  const tApp = useTranslations("app")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()

  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
      <Card role="alert">
        <CardHeader>
          <CardTitle>{tApp("errors.app", { app: APP_NAME })}</CardTitle>
          <CardDescription>{messageOf(error)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => retry()}>
            <RefreshCw className="size-4" />
            {tCommon("retry.tryAgain")}
          </Button>
          <Button asChild variant="ghost">
            <PublicLink href={ROUTES.landing}>{tApp("notFound.backLanding")}</PublicLink>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
