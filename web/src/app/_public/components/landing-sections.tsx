// Lower showcase sections for the server-rendered landing page (`/` and `/hi`, Phase 29).
// Uses PUBLIC_CONTAINER across every band and links visitors cleanly to How It Works, Features, and FAQ.

import { ArrowRight, Globe } from "lucide-react"

import { PublicLink } from "@/i18n/navigation"
import { ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES, LANGUAGES } from "@/shared/i18n/languages"
import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { PUBLIC_CONTAINER } from "./container"
import { PublicSessionAction } from "./public-session-action"

/** Four clickable product pillar cards linking visitors to `/features` and `/faq`. */
export function LandingPillarsSection({ texts }: { texts: PublicSiteTexts }) {
  const { landing } = texts
  return (
    <section className="bg-muted/30 py-12 sm:py-16 lg:py-20">
      <div className={PUBLIC_CONTAINER}>
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{landing.pillarsTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{landing.pillarsSubtitle}</p>
        </div>
        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
          {landing.pillars.map((pillar) => (
            <PublicLink
              key={pillar.title}
              href={{ pathname: ROUTES[pillar.hrefKey], hash: pillar.hash.replace(/^#/, "") }}
              className="group flex min-w-0 flex-col justify-between rounded-2xl border bg-card p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md sm:p-6"
            >
              <div>
                <p className="text-xs font-semibold tracking-wider text-primary uppercase">{pillar.eyebrow}</p>
                <h3 className="mt-2 text-base font-semibold tracking-tight">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
              </div>
              <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span>{pillar.linkLabel}</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </PublicLink>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Three-step workflow summary, bilingual switcher highlight, and bottom call-to-action band. */
export function LandingWorkflowAndCta({ texts }: { texts: PublicSiteTexts }) {
  const { landing } = texts
  const otherLanguages = LANGUAGE_CODES.filter((code) => code !== texts.lang)

  return (
    <>
      <section className="border-t py-12 sm:py-16 lg:py-20">
        <div className={PUBLIC_CONTAINER}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="min-w-0 max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{landing.workflowTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {landing.workflowSubtitle}
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 gap-2">
              <PublicLink href={ROUTES.howItWorks}>
                <span>{landing.workflowCta}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </PublicLink>
            </Button>
          </div>
          <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-3 md:gap-6">
            {landing.workflowSteps.map((step) => (
              <div key={step.step} className="min-w-0 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
                <span className="inline-flex rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tabular-nums">
                  {step.step}
                </span>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-muted/30 py-14">
        <div className={PUBLIC_CONTAINER}>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:p-8 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary">
                <Globe className="size-4" aria-hidden="true" />
                <span>{LANGUAGE_CODES.map((code) => LANGUAGES[code].name).join(" · ")}</span>
              </div>
              <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">{landing.bilingualBannerTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{landing.bilingualBannerSubtitle}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {otherLanguages.map((code) => (
                <Button key={code} asChild variant="outline" className="gap-2">
                  <PublicLink href={ROUTES.landing} locale={code} lang={code} hrefLang={code}>
                    <span>{otherLanguages.length === 1 ? landing.bilingualCta : LANGUAGES[code].name}</span>
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </PublicLink>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className={PUBLIC_CONTAINER}>
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 text-slate-50 shadow-xl sm:p-10 lg:p-12 dark:border dark:border-primary/25 dark:from-card dark:via-primary/10 dark:to-card dark:text-card-foreground">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{landing.ctaTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base dark:text-muted-foreground">
                  {landing.ctaSubtitle}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <PublicSessionAction
                  signedOutLabel={landing.getStarted}
                  signedInLabel={landing.openDashboard}
                  variant="secondary"
                  size="lg"
                />
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-border dark:text-foreground"
                >
                  <PublicLink href={ROUTES.faq}>{landing.faqCta}</PublicLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
