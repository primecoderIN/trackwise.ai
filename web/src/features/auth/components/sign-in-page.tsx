// The sign-in page (/sign-in): crisp brand card, failure alerts, provider login links, calm privacy reassurance, and
// localized public/legal links positioned cleanly below the card. Part of the auth feature (components/).

import { ShieldCheck, Wallet } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { AUTH } from "@/shared/api/contracts.gen"
import { SectionError } from "@/shared/components/section-error"
import { APP_NAME } from "@/shared/config/app"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { LanguageMenu, useLanguage } from "@/shared/i18n"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { ModeToggle } from "@/shared/theme"
import { Card, CardContent, CardDescription, CardHeader } from "@/shared/ui/card"

import { useLoginOptions, useSignedInUser } from "../queries"
import { afterSignIn, failureText } from "../sign-in-urls"
import { useSessionSync } from "../use-session-sync"
import { SessionChecking } from "./session-screens"
import { SignInOptions } from "./sign-in-options"

/**
 * The sign-in page. Redirects already-signed-in users to `return_to` or Dashboard; otherwise displays the provider
 * options inside a calm, uncluttered card.
 */
export function SignInPage() {
  const t = useTranslations("auth")
  const messageOf = useMessageOf()
  const { language } = useLanguage()
  const params = useSearchParams()
  const router = useRouter()
  const user = useSignedInUser()
  useSessionSync(user.data !== undefined)
  const options = useLoginOptions(user.data === null)
  const returnTo = params.get(AUTH.params.returnTo)
  const failure = failureText(params.get(AUTH.params.error))

  useEffect(() => {
    if (user.data) router.replace(afterSignIn(returnTo, window.location.origin))
  }, [user.data, returnTo, router])

  if (user.isPending || user.data) {
    return <SessionChecking />
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_11%,transparent),transparent_60%)] px-4 pt-16 pb-8 sm:py-12">
      <div className="absolute top-4 right-4 flex items-center gap-1">
        <LanguageMenu />
        <ModeToggle />
      </div>

      {options.isError ? (
        <div className="w-full max-w-sm">
          <SectionError
            title={t("signIn.optionsFailed")}
            message={messageOf(options.error)}
            onRetry={() => options.refetch()}
            retrying={options.isFetching}
          />
        </div>
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <Card className="w-full shadow-md">
            <CardHeader className="items-center pb-2 text-center">
              <span className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm">
                <Wallet aria-hidden className="size-5" />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight">{t("signIn.title", { app: APP_NAME })}</h1>
              <CardDescription>{t("signIn.description")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {failure && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/35 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
                >
                  {t(`failures.${failure}`, { app: APP_NAME })}
                </p>
              )}
              <SignInOptions options={options.data} returnTo={returnTo} />
              <p className="inline-flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span>{t("signIn.privacyNote")}</span>
              </p>
            </CardContent>
          </Card>

          <nav
            aria-label={t("signIn.linksLabel")}
            className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
          >
            <Link href={localizedPath(ROUTES.landing, language)} className="transition-colors hover:text-foreground">
              {t("signIn.home")}
            </Link>
            <Link href={localizedPath(ROUTES.howItWorks, language)} className="transition-colors hover:text-foreground">
              {t("signIn.howItWorks")}
            </Link>
            <Link href={localizedPath(ROUTES.features, language)} className="transition-colors hover:text-foreground">
              {t("signIn.features")}
            </Link>
            <Link href={localizedPath(ROUTES.faq, language)} className="transition-colors hover:text-foreground">
              {t("signIn.faq")}
            </Link>
            <Link href={localizedPath(ROUTES.contact, language)} className="transition-colors hover:text-foreground">
              {t("signIn.contact")}
            </Link>
            <Link href={localizedPath(ROUTES.privacy, language)} className="transition-colors hover:text-foreground">
              {t("signIn.privacy")}
            </Link>
            <Link href={localizedPath(ROUTES.terms, language)} className="transition-colors hover:text-foreground">
              {t("signIn.terms")}
            </Link>
          </nav>
        </div>
      )}
    </main>
  )
}
