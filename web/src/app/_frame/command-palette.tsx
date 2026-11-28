"use client"

// The command palette (Ctrl/⌘ + K): jump to any page, start a new expense, toggle the assistant, switch theme, or
// switch language. Built on @primecoderin/fast-ui-react's CommandPalette. Part of app/_frame/.

import { CommandPalette as FastCommandPalette, type CommandGroup, useAppToast } from "@primecoderin/fast-ui-react"
import { Globe, Plus, Sparkles, SunMoon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo } from "react"

import { useUpdatePreferences } from "@/features/account"
import { ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES, LANGUAGES, useLanguage } from "@/shared/i18n"
import { notifyNavigationStart } from "@/shared/lib/navigation-progress"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { useTheme } from "@/shared/theme"

import { PAGES } from "./pages"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleChat: () => void
}

/** The Ctrl/⌘+K command palette dialog: keyboard-navigable list of pages and quick actions. */
export function CommandPalette({ open, onOpenChange, onToggleChat }: CommandPaletteProps) {
  const t = useTranslations("app")
  const tCommon = useTranslations("common")
  const toast = useAppToast()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const updatePreferences = useUpdatePreferences()
  const messageOf = useMessageOf()

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [open, onOpenChange])

  const groups = useMemo<CommandGroup[]>(() => {
    const otherLanguages = LANGUAGE_CODES.filter((code) => code !== language)
    return [
      {
        id: "pages",
        label: t("palette.pagesGroup"),
        items: PAGES.map((page) => ({
          id: `page-${page.name}`,
          label: t(`pages.${page.name}`),
          icon: <page.icon />,
          onSelect: () => {
            notifyNavigationStart()
            router.push(page.path)
          },
        })),
      },
      {
        id: "actions",
        label: t("palette.actionsGroup"),
        items: [
          {
            id: "action-new-expense",
            label: t("palette.newExpense"),
            icon: <Plus />,
            onSelect: () => {
              notifyNavigationStart()
              router.push(`${ROUTES.expenses}?add=1`)
            },
          },
          {
            id: "action-open-assistant",
            label: t("palette.openAssistant"),
            icon: <Sparkles />,
            onSelect: onToggleChat,
          },
          {
            id: "action-toggle-theme",
            label: t("palette.toggleTheme"),
            icon: <SunMoon />,
            onSelect: () => {
              const isDark =
                theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
              setTheme(isDark ? "light" : "dark")
            },
          },
          ...otherLanguages.map((code) => ({
            id: `action-lang-${code}`,
            label: t("palette.switchLanguage", { language: LANGUAGES[code].name }),
            icon: <Globe />,
            onSelect: () => {
              setLanguage(code)
                .then(() =>
                  updatePreferences.mutate(
                    { preferred_language: code },
                    { onError: (error) => toast.error(messageOf(error)) },
                  ),
                )
                .catch(() => toast.error(tCommon("language.loadFailed", { language: LANGUAGES[code].name })))
            },
          })),
        ],
      },
    ]
  }, [t, tCommon, toast, router, onToggleChat, theme, setTheme, language, setLanguage, updatePreferences, messageOf])

  return (
    <FastCommandPalette
      open={open}
      onOpenChange={onOpenChange}
      groups={groups}
      labels={{
        title: t("palette.title"),
        placeholder: t("palette.placeholder"),
        noResults: t("palette.empty"),
      }}
    />
  )
}
