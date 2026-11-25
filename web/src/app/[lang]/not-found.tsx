// Server-rendered 404 page inside `[lang]` routes: reads the active locale on the server and renders localized
// copy without shipping an unused client bundle.

import Link from "next/link"
import { getLocale } from "next-intl/server"

import { PublicLink } from "@/i18n/navigation"
import { ROUTES } from "@/shared/config/routes"
import { DEFAULT_LANGUAGE, isLanguage } from "@/shared/i18n/languages"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/shared/ui/card"

/** Localized 404 view for `[lang]` public routes. */
export default async function LocalizedNotFound() {
  const rawLocale = await getLocale()
  const lang = isLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE
  const appTexts = lang === "hi" ? (await import("@/app/_i18n/hi")).default : (await import("@/app/_i18n/en")).default

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">{appTexts.notFound.title}</h1>
          <CardDescription>{appTexts.notFound.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild>
            <PublicLink href={ROUTES.landing}>{appTexts.notFound.backLanding}</PublicLink>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.dashboard}>{appTexts.notFound.backHome}</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
