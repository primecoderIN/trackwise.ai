// Server-rendered global landing page for trackwise.ai (`/` and `/hi`, Phase 29).
// Uses a 12-column split hero with an interactive walkthrough player and delegates lower bands.

import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"

import { siteUrl } from "@/app/_seo/seo"
import { APP_NAME } from "@/shared/config/app"
import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { PUBLIC_CONTAINER } from "./container"
import { HeroShowcase } from "./hero-showcase"
import { LandingPillarsSection, LandingWorkflowAndCta } from "./landing-sections"
import { PublicFrame } from "./public-frame"
import { PublicSessionAction } from "./public-session-action"

function LandingJsonLd({ texts }: { texts: PublicSiteTexts }) {
  const origin = siteUrl()
  const pageUrl = new URL(texts.paths.landing, origin).toString()
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
      <section className="relative overflow-hidden border-b bg-[radial-gradient(ellipse_at_top,oklch(0.47_0.19_262_/_0.09),transparent_65%)] py-12 sm:py-16 lg:py-20">
        <div className={`${PUBLIC_CONTAINER} grid items-center gap-10 lg:grid-cols-12 xl:gap-14`}>
          <div className="flex flex-col items-start text-left lg:col-span-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
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
                <Link href={texts.paths.howItWorks}>
                  <span>{landing.howItWorksCta}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
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
          <div className="lg:col-span-7">
            <HeroShowcase texts={texts} />
          </div>
        </div>
      </section>
      <LandingPillarsSection texts={texts} />
      <LandingWorkflowAndCta texts={texts} />
    </PublicFrame>
  )
}
