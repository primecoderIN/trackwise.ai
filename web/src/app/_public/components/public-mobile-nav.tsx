"use client"

// Slide-out mobile navigation drawer for public marketing pages, keeping the sticky mobile header compact on phones.
// Part of app/_public/components/; used by public-frame.tsx.

import { Globe, Menu, Wallet } from "lucide-react"
import { useState } from "react"

import { PublicLink } from "@/i18n/navigation"
import { APP_NAME } from "@/shared/config/app"
import { LANGUAGE_CODES, LANGUAGES, type Language } from "@/shared/i18n/languages"
import { Button } from "@/shared/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet"

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={menuLabel} className="lg:hidden">
          <Menu className="size-4.5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(18rem,calc(100vw-2rem))] gap-0 p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
              <Wallet className="size-3.5" aria-hidden="true" />
            </span>
            <span>{APP_NAME}</span>
          </SheetTitle>
          <SheetDescription className="sr-only">{menuLabel}</SheetDescription>
        </SheetHeader>
        <nav aria-label={menuLabel} className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = currentPage === item.key
            return (
              <PublicLink
                key={item.key}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </PublicLink>
            )
          })}
          {otherLanguages.length > 0 && (
            <div className="mt-3 border-t pt-3">
              {otherLanguages.map((code) => (
                <PublicLink
                  key={code}
                  href={currentHref}
                  locale={code}
                  lang={code}
                  hrefLang={code}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Globe className="size-4" aria-hidden="true" />
                  <span>{LANGUAGES[code].name}</span>
                </PublicLink>
              ))}
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
