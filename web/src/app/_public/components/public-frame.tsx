// Shared navigation header and footer for every server-rendered public page (Phase 29 + UX polish).
// Adds light/dark theme toggle, compact slide-out mobile nav, and Privacy Policy / Terms of Service footer links.

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
import { PublicMobileNav } from "./public-mobile-nav"
import { PublicSessionAction } from "./public-session-action"
import { PublicThemeToggle } from "./public-theme-toggle"

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

function PublicHeader({ texts, currentPage }: { texts: PublicSiteTexts; currentPage: PublicRouteKey }) {
  const otherLanguages = LANGUAGE_CODES.filter((code) => code !== texts.lang)
  const navEntries = NAV_ITEMS.map((key) => ({
    key,
    href: ROUTE_BY_KEY[key],
    label: texts.nav[key],
  }))

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className={`${PUBLIC_CONTAINER} flex h-16 items-center justify-between gap-2 sm:gap-4`}>
        <PublicLink
          href={ROUTES.landing}
          className="flex min-w-0 items-center gap-2 font-semibold tracking-tight sm:gap-2.5"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate text-sm sm:text-base">{APP_NAME}</span>
        </PublicLink>

        <nav aria-label={texts.nav.primaryLabel} className="hidden items-center gap-1 lg:flex">
          {navEntries.map((item) => {
            const active = currentPage === item.key
            return (
              <PublicLink
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </PublicLink>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {otherLanguages.map((code) => (
            <Button
              key={code}
              asChild
              variant="ghost"
              size="sm"
              className="hidden gap-1.5 text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <PublicLink href={ROUTE_BY_KEY[currentPage]} locale={code} lang={code} hrefLang={code}>
                <Globe className="size-3.5" aria-hidden="true" />
                <span>{LANGUAGES[code].name}</span>
              </PublicLink>
            </Button>
          ))}
          <PublicThemeToggle />
          <PublicSessionAction
            signedOutLabel={texts.nav.signIn}
            signedInLabel={texts.nav.openApp}
            size="sm"
            className="px-2.5 text-xs sm:px-3 sm:text-sm"
          />
          <PublicMobileNav
            lang={texts.lang}
            currentPage={currentPage}
            currentHref={ROUTE_BY_KEY[currentPage]}
            menuLabel={texts.nav.menuLabel}
            items={navEntries}
          />
        </div>
      </div>
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
    {
      heading: footer.legalHeading,
      links: [
        { href: ROUTES.privacy, label: footer.privacy },
        { href: ROUTES.terms, label: footer.terms },
      ],
    },
  ]

  return (
    <footer className="border-t border-border/80 bg-muted/30">
      <div className={`${PUBLIC_CONTAINER} grid gap-8 py-10 text-sm sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-5`}>
        <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
          <PublicLink href={ROUTES.landing} className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
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
                  <PublicLink href={item.href} className="transition-colors hover:text-foreground">
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
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
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

/** Shared public navigation header with theme toggle, slide-out mobile nav, and 5-column footer with legal links. */
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
      <main className="min-w-0 flex-1">{children}</main>
      <PublicFooter texts={texts} currentPage={currentPage} />
    </div>
  )
}
