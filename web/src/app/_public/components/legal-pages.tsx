// Server-rendered Legal (Privacy Policy & Terms of Service) and Contact / DPDP Grievance pages (Phase 29).
// Uses PUBLIC_CONTAINER with a 12-column sticky section index on Legal pages so wide screens stay balanced.

import { Mail, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { Button } from "@/shared/ui/button"

import type { PublicSiteTexts } from "../texts"
import { PUBLIC_CONTAINER } from "./container"
import { PublicFrame } from "./public-frame"

/** Structured two-column SaaS layout for Privacy Policy and Terms of Service in both English and Hindi. */
export function PublicLegalPage({ texts, kind }: { texts: PublicSiteTexts; kind: "privacy" | "terms" }) {
  const page = kind === "privacy" ? texts.privacyPage : texts.termsPage
  const currentPage = kind === "privacy" ? "privacy" : "terms"

  return (
    <PublicFrame texts={texts} currentPage={currentPage}>
      <section className="border-b bg-muted/25 py-12">
        <div className={PUBLIC_CONTAINER}>
          <p className="text-xs font-medium text-primary">{page.updated}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-muted-foreground sm:text-base">{page.intro}</p>
        </div>
      </section>

      <section className="py-12">
        <div className={`${PUBLIC_CONTAINER} grid gap-10 lg:grid-cols-12`}>
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24 rounded-2xl border bg-card p-5 shadow-xs">
              <ul className="space-y-2 text-sm">
                {page.sections.map((section, idx) => (
                  <li key={section.heading}>
                    <a
                      href={`#section-${idx + 1}`}
                      className="block rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={texts.paths.security}>{texts.nav.security}</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={texts.paths.contact}>{texts.nav.contact}</Link>
                </Button>
              </div>
            </div>
          </aside>

          <div className="space-y-5 lg:col-span-8">
            {page.sections.map((section, idx) => (
              <section
                key={section.heading}
                id={`section-${idx + 1}`}
                className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-xs sm:p-7"
              >
                <h2 className="text-base font-semibold tracking-tight sm:text-lg">{section.heading}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </PublicFrame>
  )
}

/** Public Support and DPDP Grievance Officer contact page (`/contact` and `/hi/contact`). */
export function PublicContactPage({ texts }: { texts: PublicSiteTexts }) {
  const { contactPage } = texts

  return (
    <PublicFrame texts={texts} currentPage="contact">
      <section className="border-b bg-muted/25 py-12">
        <div className={PUBLIC_CONTAINER}>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{contactPage.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {contactPage.intro}
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className={PUBLIC_CONTAINER}>
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{contactPage.supportHeading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{contactPage.supportBody}</p>
              <p className="mt-4 text-sm font-semibold text-primary">
                <a href={`mailto:${contactPage.supportEmail}`} className="hover:underline">
                  {contactPage.supportEmail}
                </a>
              </p>
            </section>

            <section className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{contactPage.grievanceHeading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{contactPage.grievanceBody}</p>
              <p className="mt-4 text-sm font-semibold text-primary">
                <a href={`mailto:${contactPage.grievanceEmail}`} className="hover:underline">
                  {contactPage.grievanceEmail}
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border bg-muted/30 p-6 sm:flex-row sm:items-center">
            <p className="text-xs leading-relaxed text-muted-foreground">{contactPage.responseNote}</p>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={texts.paths.faq}>{texts.nav.faq}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={texts.paths.security}>{texts.nav.security}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicFrame>
  )
}
