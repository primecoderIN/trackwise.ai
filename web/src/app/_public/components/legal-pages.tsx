// Server-rendered Legal (Privacy Policy & Terms of Service) and global Contact pages (Phase 29).
// Uses PUBLIC_CONTAINER with a 12-column sticky section index on Legal pages and global support cards on Contact.

import { Mail, ShieldCheck } from "lucide-react"

import { PublicLink } from "@/i18n/navigation"
import { linkButtonClass } from "@/shared/components/link-button"
import { localizedPath, ROUTES } from "@/shared/config/routes"

import type { PublicSiteTexts } from "../texts"
import { BreadcrumbJsonLd } from "./breadcrumb-json-ld"
import { PUBLIC_CONTAINER } from "./container"
import { PublicFrame } from "./public-frame"

/** Structured two-column layout for Privacy Policy and Terms of Service in both English and Hindi. */
export function PublicLegalPage({ texts, kind }: { texts: PublicSiteTexts; kind: "privacy" | "terms" }) {
  const page = kind === "privacy" ? texts.privacyPage : texts.termsPage
  const currentPage = kind === "privacy" ? "privacy" : "terms"
  const currentRoute = kind === "privacy" ? ROUTES.privacy : ROUTES.terms

  return (
    <PublicFrame texts={texts} currentPage={currentPage}>
      <BreadcrumbJsonLd
        homeName={texts.footer.home}
        homePath={localizedPath(ROUTES.landing, texts.lang)}
        pageName={page.title}
        pagePath={localizedPath(currentRoute, texts.lang)}
      />
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
                <PublicLink href={ROUTES.faq} className={linkButtonClass({ variant: "secondary", size: "small" })}>
                  {texts.nav.faq}
                </PublicLink>
                <PublicLink href={ROUTES.contact} className={linkButtonClass({ variant: "secondary", size: "small" })}>
                  {texts.nav.contact}
                </PublicLink>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-5 lg:col-span-8">
            {page.sections.map((section, idx) => (
              <section
                key={section.heading}
                id={`section-${idx + 1}`}
                className="scroll-mt-24 rounded-2xl border bg-card p-5 shadow-xs sm:p-7"
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

/** Public Support and Privacy Requests contact page (`/contact` and `/hi/contact`). */
export function PublicContactPage({ texts }: { texts: PublicSiteTexts }) {
  const { contactPage } = texts

  return (
    <PublicFrame texts={texts} currentPage="contact">
      <BreadcrumbJsonLd
        homeName={texts.footer.home}
        homePath={localizedPath(ROUTES.landing, texts.lang)}
        pageName={texts.nav.contact}
        pagePath={localizedPath(ROUTES.contact, texts.lang)}
      />
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
              <h2 className="mt-4 text-lg font-semibold">{contactPage.privacyHeading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{contactPage.privacyBody}</p>
              <p className="mt-4 text-sm font-semibold text-primary">
                <a href={`mailto:${contactPage.privacyEmail}`} className="hover:underline">
                  {contactPage.privacyEmail}
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border bg-muted/30 p-5 sm:flex-row sm:items-center sm:p-6">
            <p className="text-xs leading-relaxed text-muted-foreground">{contactPage.responseNote}</p>
            <div className="flex shrink-0 flex-wrap gap-2">
              <PublicLink href={ROUTES.faq} className={linkButtonClass({ variant: "secondary", size: "small" })}>
                {texts.nav.faq}
              </PublicLink>
              <PublicLink href={ROUTES.howItWorks} className={linkButtonClass({ variant: "secondary", size: "small" })}>
                {texts.nav.howItWorks}
              </PublicLink>
            </div>
          </div>
        </div>
      </section>
    </PublicFrame>
  )
}
