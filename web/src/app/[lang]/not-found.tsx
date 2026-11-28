// Server-rendered 404 page inside `[lang]` routes: reads active translations from next-intl on the server.

import { Card } from "@primecoderin/fast-ui-react"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { PublicLink } from "@/i18n/navigation"
import { linkButtonClass } from "@/shared/components/link-button"
import { ROUTES } from "@/shared/config/routes"

/** Localized 404 view for `[lang]` public routes. */
export default async function LocalizedNotFound() {
  const t = await getTranslations("app")

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-fg">{t("notFound.title")}</h1>
          <p className="text-sm text-fg-secondary">{t("notFound.description")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PublicLink href={ROUTES.landing} className={linkButtonClass({ variant: "primary", size: "small" })}>
            {t("notFound.backLanding")}
          </PublicLink>
          <Link href={ROUTES.dashboard} className={linkButtonClass({ variant: "secondary", size: "small" })}>
            {t("notFound.backHome")}
          </Link>
        </div>
      </Card>
    </main>
  )
}
