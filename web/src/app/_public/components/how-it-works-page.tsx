// Server-rendered How It Works page (`/how-it-works` and `/hi/how-it-works`, Phase 29).
// Presents the four-step expense workflow, control guarantees, BreadcrumbList JSON-LD, and HowTo JSON-LD.

import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"

import { PublicLink } from "@/i18n/navigation"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { BreadcrumbJsonLd } from "./breadcrumb-json-ld"
import { PUBLIC_CONTAINER } from "./container"
import { PublicFrame } from "./public-frame"
import { PublicSessionAction } from "./public-session-action"

function HowToJsonLd({ texts }: { texts: PublicSiteTexts }) {
  const { howItWorksPage } = texts
  const schema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howItWorksPage.heroTitle,
    description: howItWorksPage.metaDescription,
    inLanguage: texts.lang,
    step: howItWorksPage.steps.map((item, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: item.title,
      text: item.description,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  )
}

/** Dedicated step-by-step How It Works page explaining capture, confirmation, budgets, and reports. */
export function PublicHowItWorksPage({ texts }: { texts: PublicSiteTexts }) {
  const { howItWorksPage } = texts

  return (
    <PublicFrame texts={texts} currentPage="howItWorks">
      <HowToJsonLd texts={texts} />
      <BreadcrumbJsonLd
        homeName={texts.footer.home}
        homePath={localizedPath(ROUTES.landing, texts.lang)}
        pageName={texts.nav.howItWorks}
        pagePath={localizedPath(ROUTES.howItWorks, texts.lang)}
      />

      <section className="border-b border-border/80 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_65%)] pt-12 pb-14 sm:pt-16">
        <div className={PUBLIC_CONTAINER}>
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              {howItWorksPage.heroBadge}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
              {howItWorksPage.heroTitle}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {howItWorksPage.heroSubtitle}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PublicSessionAction
                signedOutLabel={howItWorksPage.getStarted}
                signedInLabel={howItWorksPage.openDashboard}
                size="lg"
              />
              <Button asChild variant="outline" size="lg" className="gap-2">
                <PublicLink href={ROUTES.features}>
                  <span>{howItWorksPage.exploreFeatures}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </PublicLink>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={PUBLIC_CONTAINER}>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{howItWorksPage.stepsTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {howItWorksPage.stepsSubtitle}
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {howItWorksPage.steps.map((item) => (
              <article
                key={item.step}
                className="flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-xs sm:p-8"
              >
                <div>
                  <span className="inline-flex rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary tabular-nums">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
                <p className="mt-5 flex items-start gap-2 border-t pt-4 text-xs font-medium text-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item.detail}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="control" className="scroll-mt-20 border-y bg-muted/30 py-16">
        <div className={PUBLIC_CONTAINER}>
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{howItWorksPage.guaranteesTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {howItWorksPage.guaranteesSubtitle}
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {howItWorksPage.guarantees.map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-xs">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className={PUBLIC_CONTAINER}>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{howItWorksPage.ctaTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{howItWorksPage.ctaSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <PublicLink href={ROUTES.features}>{howItWorksPage.exploreFeatures}</PublicLink>
              </Button>
              <Button asChild variant="outline">
                <PublicLink href={ROUTES.faq}>{howItWorksPage.readFaq}</PublicLink>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicFrame>
  )
}
