// Shared SaaS navigation header and multi-column footer for every server-rendered public page (Phase 29).
// Preserves the current page across EN/HI switches with zero client JS overhead on navigation or mobile quick-links.

import { Globe, Wallet } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { NavProgressBar } from "@/shared/components/nav-progress-bar"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { Button } from "@/shared/ui/button"

import type { PublicRouteKey, PublicSiteTexts } from "../texts"
import { PUBLIC_CONTAINER } from "./container"
import { PublicSessionAction } from "./public-session-action"

const NAV_ITEMS: readonly ("features" | "security" | "faq" | "contact")[] = ["features", "security", "faq", "contact"]

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
      <Link
        key={key}
        href={texts.paths[key]}
        aria-current={active ? "page" : undefined}
        className={`${base} transition-colors ${state}`}
      >
        {texts.nav[key]}
      </Link>
    )
  })
}

function PublicHeader({ texts, currentPage }: { texts: PublicSiteTexts; currentPage: PublicRouteKey }) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
      <div className={`${PUBLIC_CONTAINER} flex h-16 items-center justify-between gap-4`}>
        <Link href={texts.paths.landing} className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <span className="text-base">{APP_NAME}</span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          <NavLinks texts={texts} currentPage={currentPage} />
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href={texts.otherPaths[currentPage]} lang={texts.otherLang} hrefLang={texts.otherLang}>
              <Globe className="size-3.5" aria-hidden="true" />
              <span>{texts.otherLangLabel}</span>
            </Link>
          </Button>
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
  const { footer, paths } = texts
  const columns = [
    {
      heading: footer.productHeading,
      links: [
        { href: paths.landing, label: footer.home },
        { href: paths.features, label: footer.features },
        { href: ROUTES.signIn, label: footer.signIn },
      ],
    },
    {
      heading: footer.trustHeading,
      links: [
        { href: paths.security, label: footer.security },
        { href: paths.faq, label: footer.faq },
        { href: paths.contact, label: footer.contact },
      ],
    },
    {
      heading: footer.legalHeading,
      links: [
        { href: paths.privacy, label: footer.privacy },
        { href: paths.terms, label: footer.terms },
      ],
    },
  ]

  return (
    <footer className="border-t bg-muted/35">
      <div className={`${PUBLIC_CONTAINER} grid gap-10 py-12 text-sm md:grid-cols-4`}>
        <div className="flex flex-col gap-3">
          <Link href={paths.landing} className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wallet className="size-3.5" aria-hidden="true" />
            </span>
            <span>{APP_NAME}</span>
          </Link>
          <p className="text-xs leading-relaxed text-muted-foreground">{footer.tagline}</p>
          <p className="text-xs text-muted-foreground">{footer.rights}</p>
        </div>
        {columns.map((col, index) => (
          <div key={col.heading} className="flex flex-col gap-2.5">
            <p className="text-xs font-semibold tracking-wider text-foreground uppercase">{col.heading}</p>
            <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
              {col.links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
              {index === columns.length - 1 ? (
                <li>
                  <Link
                    href={texts.otherPaths[currentPage]}
                    lang={texts.otherLang}
                    hrefLang={texts.otherLang}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    <Globe className="size-3" aria-hidden="true" />
                    <span>{texts.otherLangLabel}</span>
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  )
}

/** Shared executive SaaS header, mobile quick-nav strip, and 4-column wide footer for all public pages. */
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
    <div lang={texts.lang} className="flex min-h-svh flex-col bg-background text-foreground">
      <PublicHeader texts={texts} currentPage={currentPage} />
      <main className="flex-1">{children}</main>
      <PublicFooter texts={texts} currentPage={currentPage} />
    </div>
  )
}
