"use client"

// The command palette (Ctrl/⌘ + K): jump to any page, start a new expense, toggle the assistant, switch theme, or
// switch language. Built on Radix Dialog with a borderless search header and keyboard footer hints. Part of app/_frame/.

import { CornerDownLeft, Globe, Plus, Search, Sparkles, SunMoon, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { toast } from "sonner"

import { useUpdatePreferences } from "@/features/account"
import { ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES, LANGUAGES, useLanguage } from "@/shared/i18n"
import { notifyNavigationStart } from "@/shared/lib/navigation-progress"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { useTheme } from "@/shared/theme"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"

import { PAGES } from "./pages"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleChat: () => void
}

interface PaletteItem {
  id: string
  label: string
  group: "pages" | "actions"
  icon: LucideIcon
  run: () => void
}

/** The Ctrl/⌘+K command palette dialog: keyboard-navigable list of pages and quick actions. */
export function CommandPalette({ open, onOpenChange, onToggleChat }: CommandPaletteProps) {
  const t = useTranslations("app")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const updatePreferences = useUpdatePreferences()
  const messageOf = useMessageOf()
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

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

  const items = useMemo<PaletteItem[]>(() => {
    const pageItems: PaletteItem[] = PAGES.map((page) => ({
      id: `page-${page.name}`,
      label: t(`pages.${page.name}`),
      group: "pages",
      icon: page.icon,
      run: () => {
        notifyNavigationStart()
        router.push(page.path)
      },
    }))
    const otherLanguages = LANGUAGE_CODES.filter((code) => code !== language)
    const actionItems: PaletteItem[] = [
      {
        id: "action-new-expense",
        label: t("palette.newExpense"),
        group: "actions",
        icon: Plus,
        run: () => {
          notifyNavigationStart()
          router.push(`${ROUTES.expenses}?add=1`)
        },
      },
      {
        id: "action-open-assistant",
        label: t("palette.openAssistant"),
        group: "actions",
        icon: Sparkles,
        run: () => onToggleChat(),
      },
      {
        id: "action-toggle-theme",
        label: t("palette.toggleTheme"),
        group: "actions",
        icon: SunMoon,
        run: () => {
          const isDark =
            theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
          setTheme(isDark ? "light" : "dark")
        },
      },
      ...otherLanguages.map((code) => ({
        id: `action-lang-${code}`,
        label: t("palette.switchLanguage", { language: LANGUAGES[code].name }),
        group: "actions" as const,
        icon: Globe,
        run: () => {
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
    ]
    return [...pageItems, ...actionItems]
  }, [t, tCommon, router, onToggleChat, theme, setTheme, language, setLanguage, updatePreferences, messageOf])

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return items
    return items.filter((item) => item.label.toLowerCase().includes(trimmed))
  }, [items, query])

  const safeIndex = filtered.length > 0 ? Math.min(activeIndex, filtered.length - 1) : 0

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("")
      setActiveIndex(0)
    }
    onOpenChange(next)
  }

  function selectItem(item: PaletteItem) {
    handleOpenChange(false)
    item.run()
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (filtered.length === 0) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % filtered.length)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + filtered.length) % filtered.length)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const target = filtered[safeIndex]
      if (target) selectItem(target)
    }
  }

  const pageMatches = filtered.filter((item) => item.group === "pages")
  const actionMatches = filtered.filter((item) => item.group === "actions")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("palette.title")}</DialogTitle>
          <DialogDescription>{t("palette.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Input
            aria-label={t("palette.placeholder")}
            placeholder={t("palette.placeholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- opening a command palette moves focus straight to search
            autoFocus
            className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("palette.empty")}</p>
          ) : (
            <nav className="flex flex-col gap-3" aria-label={t("palette.title")}>
              <PaletteGroup
                heading={t("palette.pagesGroup")}
                items={pageMatches}
                allFiltered={filtered}
                safeIndex={safeIndex}
                onHover={setActiveIndex}
                onSelect={selectItem}
              />
              <PaletteGroup
                heading={t("palette.actionsGroup")}
                items={actionMatches}
                allFiltered={filtered}
                safeIndex={safeIndex}
                onHover={setActiveIndex}
                onSelect={selectItem}
              />
            </nav>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/35 px-3.5 py-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border bg-background px-1 font-mono text-[10px]">↑↓</kbd>
            <span>{t("palette.hintNavigate")}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border bg-background px-1 font-mono text-[10px]">↵</kbd>
            <span>{t("palette.hintOpen")}</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PaletteGroup({
  heading,
  items,
  allFiltered,
  safeIndex,
  onHover,
  onSelect,
}: {
  heading: string
  items: PaletteItem[]
  allFiltered: PaletteItem[]
  safeIndex: number
  onHover: (index: number) => void
  onSelect: (item: PaletteItem) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2.5 py-1 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
        {heading}
      </p>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const index = allFiltered.indexOf(item)
          const selected = index === safeIndex
          const Icon = item.icon
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(item)}
                onMouseEnter={() => onHover(index)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  selected ? "bg-primary/10 font-medium text-primary" : "text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {selected && <CornerDownLeft className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
