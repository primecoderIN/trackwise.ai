"use client"

// Root error boundary for the `(client)` workspace group. Catches unexpected errors below `(client)/layout.tsx`.

import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { reportUnexpected } from "@/shared/lib/errors"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

/** Route segment error fallback for workspace routes. */
export default function ClientRouteError({ error, retry }: { error: unknown; retry: () => void }) {
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
            <Link href={ROUTES.dashboard}>{tApp("errors.backHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
