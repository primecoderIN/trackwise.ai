// The "Page not found" view (404). Part of the app composition (app/). Used by the root not-found.tsx, through
// client-pages.ts. A component, so its texts are looked up when it's drawn, in the language on then.

import Link from "next/link"

import { ROUTES } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/shared/ui/card"

import { useTexts } from "../_i18n"

/** What an address with no page shows: a 404 explanation and a link back to the Dashboard. */
export function NotFoundPage() {
  const { t } = useTexts()
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 pt-12">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">{t("notFound.title")}</h1>
          <CardDescription>{t("notFound.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={ROUTES.dashboard}>{t("notFound.backHome")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.landing}>{t("notFound.backLanding")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
