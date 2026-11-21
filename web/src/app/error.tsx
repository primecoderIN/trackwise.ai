"use client"

// Next.js's root-level error boundary (app/error.tsx, Phase 28). Catches unexpected errors in any route segment below
// the root layout and offers a retry or a link home.

import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"

import en from "@/app/_i18n/en"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { messageOf, reportUnexpected } from "@/shared/lib/errors"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

/** Top-level route segment error fallback. */
export default function RootRouteError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
      <Card role="alert">
        <CardHeader>
          <CardTitle>{en.errors.app.replace("{{app}}", APP_NAME)}</CardTitle>
          <CardDescription>{messageOf(error)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => retry()}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
          <Button asChild variant="ghost">
            <Link href={ROUTES.dashboard}>{en.errors.backHome}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
