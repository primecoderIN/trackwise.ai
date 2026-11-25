// Shared navigation header and footer for every server-rendered public page (Phase 29).
// Displays only the core marketing routes (How It Works, Features, FAQ, Contact) plus sign-in and language switcher.

import { Globe, Wallet } from "lucide-react"
import type { ReactNode } from "react"

import { PublicLink } from "@/i18n/navigation"
import { NavProgressBar } from "@/shared/components/nav-progress-bar"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES, LANGUAGES } from "@/shared/i18n/languages"
import { Button } from "@/shared/ui/button"

import type { PublicRouteKey, PublicSiteTexts } from "../texts"
import { PUBLIC_CONTAINER } from "./container"
import { PublicSessionAction } from "./public-session-action"

const NAV_ITEMS: readonly ("howItWorks" | "features" | "faq" | "contact")[] = [
  "howItWorks",
  "features",
  "faq",
  "contact",
]

const ROUTE_BY_KEY: Record<PublicRouteKey, string> = {
  landing: ROUTES.landing,
  howItWorks: ROUTES.howItWorks,
  features: ROUTES.features,
  faq: ROUTES.faq,
  contact: ROUTES.contact,
  privacy: ROUTES.privacy,
  terms: ROUTES.terms,
}

function NavLinks({
  texts,
  currentPage,
  mobile,
}: {
  texts: PublicSiteTexts
  currentPage: PublicRouteKey
  mobile?: boolean
}) {
  return NAV_ITEMS.map((key) => {
    const active = currentPage === key
    const base = mobile ? "shrink-0 rounded-md px-2.5 py-1 text-xs" : "rounded-md px-3 py-1.5 text-sm"
    const state = active
      ? "bg-primary/10 font-medium text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
    return (
      <PublicLink
        key={key}
        href={ROUTE_BY_KEY[key]}
        aria-current={active ? "page" : undefined}
        className={`${base} transition-colors ${state}`}
      >
        {texts.nav[key]}
      </PublicLink>
    )
  })
}

function PublicHeader({ texts, currentPage }: { texts: PublicSiteTexts; currentPage: PublicRouteKey }) {
  const otherLanguages = LANGUAGE_CODES.filter((code) => code !== texts.lang)
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
      <div className={`${PUBLIC_CONTAINER} flex h-16 items-center justify-between gap-4`}>
        <PublicLink href={ROUTES.landing} className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base">{APP_NAME}</span>
        </PublicLink>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          <NavLinks texts={texts} currentPage={currentPage} />
        </nav>
        <div className="flex items-center gap-2">
          {otherLanguages.map((code) => (
            <Button
              key={code}
              asChild
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <PublicLink href={ROUTE_BY_KEY[currentPage]} locale={code} lang={code} hrefLang={code}>
                <Globe className="size-3.5" aria-hidden="true" />
                <span>{LANGUAGES[code].name}</span>
              </PublicLink>
            </Button>
          ))}
          <PublicSessionAction signedOutLabel={texts.nav.signIn} signedInLabel={texts.nav.openApp} size="sm" />
        </div>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 md:hidden"
      >
        <NavLinks texts={texts} currentPage={currentPage} mobile />
      </nav>
      <NavProgressBar />
    </header>
  )
}

function PublicFooter({ texts, currentPage }: { texts: PublicSiteTexts; currentPage: PublicRouteKey }) {
  const { footer } = texts
  const otherLanguages = LANGUAGE_CODES.filter((code) => code !== texts.lang)
  const columns = [
    {
      heading: footer.productHeading,
      links: [
        { href: ROUTES.landing, label: footer.home },
        { href: ROUTES.howItWorks, label: footer.howItWorks },
        { href: ROUTES.features, label: footer.features },
        { href: ROUTES.signIn, label: footer.signIn },
      ],
    },
    {
      heading: footer.supportHeading,
      links: [
        { href: ROUTES.faq, label: footer.faq },
        { href: ROUTES.contact, label: footer.contact },
      ],
    },
  ]

  return (
    <footer className="border-t bg-muted/35">
      <div className={`${PUBLIC_CONTAINER} grid gap-10 py-12 text-sm md:grid-cols-4`}>
        <div className="flex flex-col gap-3">
          <PublicLink href={ROUTES.landing} className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wallet className="size-3.5" aria-hidden="true" />
            </span>
            <span>{APP_NAME}</span>
          </PublicLink>
          <p className="text-xs leading-relaxed text-muted-foreground">{footer.tagline}</p>
          <p className="text-xs text-muted-foreground">{footer.rights}</p>
        </div>
        {columns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold tracking-wider text-foreground uppercase">{col.heading}</p>
            <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
              {col.links.map((item) => (
                <li key={item.href}>
                  <PublicLink href={item.href} className="hover:text-foreground">
                    {item.label}
                  </PublicLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="flex flex-col gap-2.5">
          <p className="text-xs font-semibold tracking-wider text-foreground uppercase">{footer.languageHeading}</p>
          <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
            {otherLanguages.map((code) => (
              <li key={code}>
                <PublicLink
                  href={ROUTE_BY_KEY[currentPage]}
                  locale={code}
                  lang={code}
                  hrefLang={code}
                  aria-label={footer.languageLabel}
                  className="inline-flex items-center gap-1.5 hover:text-foreground"
                >
                  <Globe className="size-3.5" aria-hidden="true" />
                  <span>{LANGUAGES[code].name}</span>
                </PublicLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

/** Shared public navigation header, mobile quick-nav strip, and 4-column marketing footer. */
export function PublicFrame({
  texts,
  currentPage,
  children,
}: {
  texts: PublicSiteTexts
  currentPage: PublicRouteKey
  children: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <PublicHeader texts={texts} currentPage={currentPage} />
      <main className="flex-1">{children}</main>
      <PublicFooter texts={texts} currentPage={currentPage} />
    </div>
  )
}
