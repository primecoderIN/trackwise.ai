// Server-rendered 404 page inside `[lang]` routes: reads active translations from next-intl on the server.

import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { PublicLink } from "@/i18n/navigation"
import { ROUTES } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/shared/ui/card"

/** Localized 404 view for `[lang]` public routes. */
export default async function LocalizedNotFound() {
  const t = await getTranslations("app")

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">{t("notFound.title")}</h1>
          <CardDescription>{t("notFound.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <PublicLink href={ROUTES.landing}>{t("notFound.backLanding")}</PublicLink>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.dashboard}>{t("notFound.backHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
