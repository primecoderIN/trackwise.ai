"use client"

// Lightweight standalone light/dark toggle for server-rendered public pages (which render outside ThemeProvider).
// Uses the exact same localStorage key and `data-theme` HTML attribute as DesignSystemProvider.

import { Button } from "@primecoderin/fast-ui-react"
import { Moon, Sun } from "lucide-react"
import { useTranslations } from "next-intl"

import { THEME_ATTRIBUTE, THEME_STORAGE_KEY } from "@/shared/theme/theme-constants"

/** Toggles light and dark mode on public pages and persists the choice for the signed-in workspace too. */
export function PublicThemeToggle() {
  const t = useTranslations("common")

  function toggleTheme() {
    const root = document.documentElement
    const nextDark = root.getAttribute(THEME_ATTRIBUTE) !== "dark"
    root.setAttribute(THEME_ATTRIBUTE, nextDark ? "dark" : "light")
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextDark ? "dark" : "light")
    } catch {
      // Storage blocked: still applied for this page visit.
    }
  }

  return (
    <Button variant="icon" size="small" onClick={toggleTheme} aria-label={t("theme.change")} className="relative">
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" aria-hidden="true" />
      <Moon
        className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
        aria-hidden="true"
      />
    </Button>
  )
}
