// Server-rendered dedicated Features tour page (`/features` and `/hi/features`, Phase 29).
// Uses PUBLIC_CONTAINER end-to-end with alternating 5/7 text-and-preview layouts plus a consumer workflow matrix.

import { ArrowRight, CheckCircle2 } from "lucide-react"

import { PublicLink } from "@/i18n/navigation"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { BreadcrumbJsonLd } from "./breadcrumb-json-ld"
import { PUBLIC_CONTAINER } from "./container"
import { FeaturePreview } from "./feature-previews"
import { PublicFrame } from "./public-frame"
import { PublicSessionAction } from "./public-session-action"

function FeaturesHero({ texts }: { texts: PublicSiteTexts }) {
  const { featuresPage } = texts
  return (
    <section className="border-b border-border/80 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_65%)] pt-12 pb-14 sm:pt-16">
      <div className={PUBLIC_CONTAINER}>
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
            {featuresPage.heroBadge}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">{featuresPage.heroTitle}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {featuresPage.heroSubtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <PublicSessionAction
              signedOutLabel={featuresPage.getStarted}
              signedInLabel={featuresPage.openDashboard}
              size="lg"
            />
            <Button asChild variant="outline" size="lg">
              <PublicLink href={ROUTES.faq}>{featuresPage.readFaq}</PublicLink>
            </Button>
          </div>
        </div>
        <nav aria-label="Feature sections" className="mt-9 flex flex-wrap items-center gap-2">
          {featuresPage.sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border bg-background px-3.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              {section.badge}
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}

function FeaturesMatrix({ texts }: { texts: PublicSiteTexts }) {
  const { featuresPage } = texts
  return (
    <section className="border-t bg-muted/30 py-16">
      <div className={PUBLIC_CONTAINER}>
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{featuresPage.matrixTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {featuresPage.matrixSubtitle}
          </p>
        </div>
        <div className="mt-8 overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-3.5">{featuresPage.matrixHeaders.capability}</th>
                <th className="px-5 py-3.5">{featuresPage.matrixHeaders.webApp}</th>
                <th className="px-5 py-3.5">{featuresPage.matrixHeaders.assistant}</th>
                <th className="px-5 py-3.5">{featuresPage.matrixHeaders.receipts}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {featuresPage.matrixRows.map((row) => (
                <tr key={row.capability} className="align-top">
                  <th scope="row" className="px-5 py-4 font-semibold">
                    {row.capability}
                  </th>
                  <td className="px-5 py-4 text-muted-foreground">{row.webApp}</td>
                  <td className="px-5 py-4 text-muted-foreground">{row.assistant}</td>
                  <td className="px-5 py-4 text-muted-foreground">{row.receipts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

/** Dedicated Features deep-dive view covering Assistant, Receipts, Expenses, Budgets, Reports, and Workspace Controls. */
export function PublicFeaturesPage({ texts }: { texts: PublicSiteTexts }) {
  const { featuresPage } = texts
  return (
    <PublicFrame texts={texts} currentPage="features">
      <BreadcrumbJsonLd
        homeName={texts.footer.home}
        homePath={localizedPath(ROUTES.landing, texts.lang)}
        pageName={texts.nav.features}
        pagePath={localizedPath(ROUTES.features, texts.lang)}
      />
      <FeaturesHero texts={texts} />

      <div className="divide-y">
        {featuresPage.sections.map((section, index) => {
          const flipped = index % 2 === 1
          return (
            <section
              key={section.id}
              id={section.id}
              className={`scroll-mt-20 py-12 sm:py-16 lg:py-20 ${flipped ? "bg-muted/20" : ""}`}
            >
              <div className={`${PUBLIC_CONTAINER} grid items-center gap-8 sm:gap-10 lg:grid-cols-12 xl:gap-14`}>
                <div className={`min-w-0 lg:col-span-5 ${flipped ? "lg:order-2" : ""}`}>
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {section.badge}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{section.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{section.summary}</p>
                  <ul className="mt-5 space-y-2.5 text-sm">
                    {section.highlights.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`min-w-0 lg:col-span-7 ${flipped ? "lg:order-1" : ""}`}>
                  <FeaturePreview kind={section.previewKind} data={featuresPage.previewData} />
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <FeaturesMatrix texts={texts} />

      <section className="py-14">
        <div className={PUBLIC_CONTAINER}>
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-card p-6 shadow-xs sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{featuresPage.ctaTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{featuresPage.ctaSubtitle}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <PublicSessionAction
                signedOutLabel={featuresPage.getStarted}
                signedInLabel={featuresPage.openDashboard}
              />
              <Button asChild variant="outline" className="gap-1.5">
                <PublicLink href={ROUTES.howItWorks}>
                  <span>{featuresPage.howItWorksCta}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </PublicLink>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicFrame>
  )
}
