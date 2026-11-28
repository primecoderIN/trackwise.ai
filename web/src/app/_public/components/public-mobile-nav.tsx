"use client"

// Slide-out mobile navigation drawer for public marketing pages, keeping the sticky mobile header compact on phones.
// Part of app/_public/components/; used by public-frame.tsx.

import { Button, Drawer } from "@primecoderin/fast-ui-react"
import { Globe, Menu, Wallet } from "lucide-react"
import { useState } from "react"

import { PublicLink } from "@/i18n/navigation"
import { APP_NAME } from "@/shared/config/app"
import { LANGUAGE_CODES, LANGUAGES, type Language } from "@/shared/i18n/languages"

import type { PublicRouteKey } from "../texts"

interface MobileNavItem {
  key: "howItWorks" | "features" | "faq" | "contact"
  href: string
  label: string
}

interface PublicMobileNavProps {
  lang: Language
  currentPage: PublicRouteKey
  currentHref: string
  menuLabel: string
  items: readonly MobileNavItem[]
}

/** Mobile menu trigger and drawer listing public routes and language switches. */
export function PublicMobileNav({ lang, currentPage, currentHref, menuLabel, items }: PublicMobileNavProps) {
  const [open, setOpen] = useState(false)
  const otherLanguages = LANGUAGE_CODES.filter((code) => code !== lang)

  return (
    <>
      <Button
        variant="icon"
        size="small"
        icon={<Menu />}
        aria-label={menuLabel}
        onClick={() => setOpen(true)}
        className="lg:hidden"
      />
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title={APP_NAME}
        icon={<Wallet className="size-4 text-primary-text" aria-hidden="true" />}
        side="end"
        padding="none"
        className="w-[min(18rem,calc(100vw-2rem))]"
      >
        <nav aria-label={menuLabel} className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = currentPage === item.key
            return (
              <PublicLink
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3.5 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary-light font-semibold text-primary-text"
                    : "text-fg-secondary hover:bg-subtle hover:text-fg"
                }`}
              >
                {item.label}
              </PublicLink>
            )
          })}
          {otherLanguages.length > 0 && (
            <div className="mt-3 border-t border-line-subtle pt-3">
              {otherLanguages.map((code) => (
                <PublicLink
                  key={code}
                  href={currentHref}
                  locale={code}
                  lang={code}
                  hrefLang={code}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm text-fg-secondary transition-colors hover:bg-subtle hover:text-fg"
                >
                  <Globe className="size-4" aria-hidden="true" />
                  <span>{LANGUAGES[code].name}</span>
                </PublicLink>
              ))}
            </div>
          )}
        </nav>
      </Drawer>
    </>
  )
}
