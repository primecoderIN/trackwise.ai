"use client"

// The command palette (Ctrl/⌘ + K): jump to any page, start a new expense, or open the assistant (Phase 28).
// Built on the existing Radix Dialog in shared/ui/dialog.tsx with zero new npm dependencies. Part of app/_frame/.

import { MessageSquare, Plus, Search, type LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"

import { ROUTES } from "@/shared/config/routes"
import { notifyNavigationStart } from "@/shared/lib/navigation-progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"

import { PAGES } from "./pages"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenChat: () => void
}

interface PaletteItem {
  id: string
  label: string
  group: "pages" | "actions"
  icon: LucideIcon
  run: () => void
}

/** The Ctrl/⌘+K command palette dialog: keyboard-navigable list of pages and quick actions. */
export function CommandPalette({ open, onOpenChange, onOpenChat }: CommandPaletteProps) {
  const t = useTranslations("app")
  const router = useRouter()
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
        icon: MessageSquare,
        run: () => onOpenChat(),
      },
    ]
    return [...pageItems, ...actionItems]
  }, [t, router, onOpenChat])

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="sr-only">
          <DialogTitle>{t("palette.title")}</DialogTitle>
          <DialogDescription>{t("palette.description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label={t("palette.placeholder")}
              placeholder={t("palette.placeholder")}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleKeyDown}
              className="pl-8"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("palette.empty")}</p>
          ) : (
            <nav className="flex max-h-72 flex-col gap-3 overflow-y-auto" aria-label={t("palette.title")}>
              {pageMatches.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="px-2 text-xs font-medium text-muted-foreground">{t("palette.pagesGroup")}</p>
                  <ul className="flex flex-col gap-1">
                    {pageMatches.map((item) => {
                      const index = filtered.indexOf(item)
                      const selected = index === safeIndex
                      const Icon = item.icon
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-current={selected ? "true" : undefined}
                            onClick={() => selectItem(item)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                              selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                            }`}
                          >
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              {actionMatches.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="px-2 text-xs font-medium text-muted-foreground">{t("palette.actionsGroup")}</p>
                  <ul className="flex flex-col gap-1">
                    {actionMatches.map((item) => {
                      const index = filtered.indexOf(item)
                      const selected = index === safeIndex
                      const Icon = item.icon
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-current={selected ? "true" : undefined}
                            onClick={() => selectItem(item)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                              selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                            }`}
                          >
                            <Icon className="size-4 shrink-0 text-muted-foreground" />
                            <span>{item.label}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </nav>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
