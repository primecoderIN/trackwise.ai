// The sign-in page's buttons: one per way of signing in the server offers ("Continue with Google"), or a single "Sign
// in" button. Each button is a full-width navigation link to the backend's login route. Used by sign-in-page.tsx.

import { ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"

import type { LoginOption } from "../api"
import { loginUrl } from "../sign-in-urls"

const PLACEHOLDER_BUTTONS = 2

interface SignInOptionsProps {
  /** The server's ways to sign in; undefined while they load (placeholders show), [] for the provider's own page. */
  options: LoginOption[] | undefined
  /** The page to come back to (the server checks it). */
  returnTo: string | null
}

/** The ways to sign in, each a link to the backend's login route with crisp hover affordance. */
export function SignInOptions({ options, returnTo }: SignInOptionsProps) {
  const t = useTranslations("auth")
  if (options === undefined) {
    return (
      <output className="grid gap-3">
        <span className="sr-only">{t("signIn.loadingOptions")}</span>
        {Array.from({ length: PLACEHOLDER_BUTTONS }, (_, index) => (
          <Skeleton key={index} className="h-11 w-full rounded-xl" />
        ))}
      </output>
    )
  }
  if (options.length === 0) {
    return (
      <Button asChild size="lg" className="h-11 w-full rounded-xl">
        <a href={loginUrl(undefined, returnTo)}>
          <span>{t("signIn.signIn")}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      </Button>
    )
  }
  return (
    <div className="grid gap-2.5">
      {options.map((option) => (
        <Button
          key={option.key}
          asChild
          size="lg"
          variant="outline"
          className="group h-11 w-full justify-between rounded-xl px-4"
        >
          <a href={loginUrl(option.key, returnTo)}>
            <span className="font-medium">{t("signIn.continueWith", { provider: option.label })}</span>
            <ArrowRight
              className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden="true"
            />
          </a>
        </Button>
      ))}
    </div>
  )
}
