// The localized sign-in page (`/sign-in` and `/hi/sign-in`), part of `[lang]` public routes so visitors coming from
// `/hi/...` stay in Hindi and search engines receive localized metadata + hreflang alternates.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { publicPage } from "@/app/_seo/seo"
import { ClientRoot } from "@/app/_shell/client-root"
import { SignInPage } from "@/app/_views/client-pages"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage } from "@/shared/i18n/languages"

/** Localized metadata and hreflang alternates for `/sign-in` and `/hi/sign-in`. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isLanguage(lang)) return {}
  const t = await getTranslations({ locale: lang, namespace: "app" })
  return publicPage(t("pages.signIn"), ROUTES.signIn, { lang })
}

/** Localized sign-in route. */
export default async function SignIn({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLanguage(lang)) notFound()
  setRequestLocale(lang)
  return (
    <ClientRoot>
      <Suspense fallback={null}>
        <SignInPage />
      </Suspense>
    </ClientRoot>
  )
}
