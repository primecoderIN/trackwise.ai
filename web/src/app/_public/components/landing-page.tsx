// Server-rendered global landing page for trackwise.ai (`/` and `/hi`, Phase 29).
// Uses a 12-column split hero with an interactive walkthrough player and delegates lower bands.

import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

import { siteUrl } from "@/app/_seo/seo"
import { PublicLink } from "@/i18n/navigation"
import { APP_NAME } from "@/shared/config/app"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { PUBLIC_CONTAINER } from "./container"
import { HeroShowcase } from "./hero-showcase"
import { LandingPillarsSection, LandingWorkflowAndCta } from "./landing-sections"
import { PublicFrame } from "./public-frame"
import { PublicSessionAction } from "./public-session-action"

function LandingJsonLd({ texts }: { texts: PublicSiteTexts }) {
  const origin = siteUrl()
  const pageUrl = new URL(localizedPath(ROUTES.landing, texts.lang), origin).toString()
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: APP_NAME,
        url: origin.toString(),
        logo: new URL("/icon", origin).toString(),
      },
      { "@type": "WebSite", name: APP_NAME, url: origin.toString(), inLanguage: texts.lang },
      {
        "@type": "SoftwareApplication",
        name: APP_NAME,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        inLanguage: texts.lang,
        url: pageUrl,
        description: texts.landing.metaDescription,
        screenshot: new URL("/opengraph-image", origin).toString(),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        featureList: texts.featuresPage.sections.map((section) => section.title),
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  )
}

/** Public Landing view (`/` and `/hi`), with a full-width split hero and interactive walkthrough player. */
export function PublicLandingPage({ texts }: { texts: PublicSiteTexts }) {
  const { landing } = texts
  return (
    <PublicFrame texts={texts} currentPage="landing">
      <LandingJsonLd texts={texts} />
      <section className="relative overflow-hidden border-b border-border/80 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_11%,transparent),transparent_65%)] py-10 sm:py-16 lg:py-20">
        <div className={`${PUBLIC_CONTAINER} grid items-center gap-8 sm:gap-10 xl:grid-cols-12 xl:gap-14`}>
          <div className="flex min-w-0 flex-col items-start text-left xl:col-span-5">
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{landing.badge}</span>
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl xl:text-[3.1rem] xl:leading-[1.1]">
              {landing.heroTitle}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              {landing.heroSubtitle}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <PublicSessionAction
                signedOutLabel={landing.getStarted}
                signedInLabel={landing.openDashboard}
                size="lg"
              />
              <Button asChild variant="outline" size="lg" className="gap-2 bg-background">
                <PublicLink href={ROUTES.howItWorks}>
                  <span>{landing.howItWorksCta}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </PublicLink>
              </Button>
            </div>
            <ul className="mt-7 grid w-full gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground sm:grid-cols-2">
              {landing.trustStrip.map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 xl:col-span-7">
            <HeroShowcase texts={texts} />
          </div>
        </div>
      </section>
      <LandingPillarsSection texts={texts} />
      <LandingWorkflowAndCta texts={texts} />
    </PublicFrame>
  )
}
