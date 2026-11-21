// Server-rendered categorized FAQ page (`/faq` and `/hi/faq`, Phase 29).
// Uses PUBLIC_CONTAINER with a sticky left topic navigator alongside collapsible Q&As and `FAQPage` JSON-LD.

import { ArrowRight, ChevronDown, HelpCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { BreadcrumbJsonLd } from "./breadcrumb-json-ld"
import { PUBLIC_CONTAINER } from "./container"
import { PublicFrame } from "./public-frame"

function FaqJsonLd({ texts }: { texts: PublicSiteTexts }) {
  const mainEntity = texts.faqPage.categories.flatMap((category) =>
    category.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  )
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
    />
  )
}

/** Dedicated FAQ page covering Assistant, Receipts, FX, Budgets, Reports, MCP, and Security in a wide 12-col grid. */
export function PublicFaqPage({ texts }: { texts: PublicSiteTexts }) {
  const { faqPage } = texts

  return (
    <PublicFrame texts={texts} currentPage="faq">
      <FaqJsonLd texts={texts} />
      <BreadcrumbJsonLd
        homeName={texts.footer.home}
        homePath={texts.paths.landing}
        pageName={texts.nav.faq}
        pagePath={texts.paths.faq}
      />

      <section className="border-b bg-[radial-gradient(ellipse_at_top,oklch(0.47_0.19_262_/_0.08),transparent_65%)] pt-12 pb-12 sm:pt-16">
        <div className={PUBLIC_CONTAINER}>
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary">
              <HelpCircle className="size-3.5" aria-hidden="true" />
              <span>{faqPage.heroBadge}</span>
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">{faqPage.heroTitle}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {faqPage.heroSubtitle}
            </p>
          </div>
          <nav aria-label="FAQ topics" className="mt-8 flex flex-wrap items-center gap-2 lg:hidden">
            {faqPage.categories.map((cat) => (
              <a
                key={cat.id}
                href={`#${cat.id}`}
                className="rounded-full border bg-background px-3.5 py-1 text-xs font-medium text-muted-foreground hover:text-primary"
              >
                {cat.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="py-14">
        <div className={`${PUBLIC_CONTAINER} grid gap-10 lg:grid-cols-12`}>
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 flex flex-col gap-5">
              <nav aria-label="FAQ categories" className="rounded-2xl border bg-card p-5 shadow-xs">
                <ul className="space-y-1.5 text-sm">
                  {faqPage.categories.map((cat) => (
                    <li key={cat.id}>
                      <a
                        href={`#${cat.id}`}
                        className="block rounded-lg px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      >
                        {cat.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="rounded-2xl border bg-muted/35 p-6">
                <h2 className="text-base font-semibold tracking-tight">{faqPage.ctaTitle}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{faqPage.ctaSubtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild size="sm">
                    <Link href={texts.paths.contact}>{faqPage.contactCta}</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="gap-1">
                    <Link href={texts.paths.features}>
                      <span>{faqPage.featuresCta}</span>
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-12 lg:col-span-8">
            {faqPage.categories.map((category) => (
              <section key={category.id} id={category.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{category.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                <div className="mt-4 divide-y rounded-2xl border bg-card shadow-xs">
                  {category.items.map((item) => (
                    <details key={item.question} className="group px-5 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold select-none marker:hidden">
                        <span>{item.question}</span>
                        <ChevronDown
                          className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </summary>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </PublicFrame>
  )
}
