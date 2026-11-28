"use client"

// The frame around every signed-in page: collapsible desktop sidebar / mobile drawer, sleek top bar (contextual
// breadcrumb, search palette, global Add Expense CTA, and Assistant toggle with Ctrl/⌘+J), progressive full-width
// page viewport with skeleton fallback, command palette (Ctrl/⌘+K), welcome stepper dialog, and responsive Assistant
// drawer (mobile/tablet) or ResizablePanels split view (desktop).

import { Button, Drawer, Kbd, ResizablePanels, Separator } from "@primecoderin/fast-ui-react"
import { ChevronRight, PanelLeft, Plus, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from "react"

import { ChatPanel } from "@/features/assistant"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import { linkButtonClass } from "@/shared/components/link-button"
import { NavProgressBar } from "@/shared/components/nav-progress-bar"
import { PageSkeleton } from "@/shared/components/page-skeleton"
import { SectionError } from "@/shared/components/section-error"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { cn } from "@/shared/lib/utils"

import { AppSidebar } from "./app-sidebar"
import { CommandPalette } from "./command-palette"
import { currentPageFor } from "./pages"
import { useSyncUserLanguage } from "./use-sync-user-language"
import { WelcomeDialog } from "./welcome-dialog"

const NOOP_SUBSCRIBE = () => () => {}
const COMPACT_CHAT_QUERY = "(max-width: 1023px)"
const COMPACT_NAV_QUERY = "(max-width: 767px)"
const WORKSPACE_GUTTER = "px-4 sm:px-6 lg:px-10 xl:px-20 2xl:px-40"
const SPLIT_CHAT_GUTTER = "px-4 sm:px-6 lg:px-8"

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

function useIsApplePlatform(): boolean {
  return useSyncExternalStore(
    NOOP_SUBSCRIBE,
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent),
    () => false,
  )
}

function Page({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations("app")
  const messageOf = useMessageOf()
  return (
    <ErrorBoundary
      key={pathname}
      fallback={(error, reset) => <SectionError title={t("errors.page")} message={messageOf(error)} onRetry={reset} />}
    >
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

interface TopBarProps {
  chatOpen: boolean
  splitChatOpen: boolean
  isMac: boolean
  onToggleSidebar: () => void
  onToggleChat: () => void
  onOpenPalette: () => void
}

function TopBar({ chatOpen, splitChatOpen, isMac, onToggleSidebar, onToggleChat, onOpenPalette }: TopBarProps) {
  const pathname = usePathname()
  const t = useTranslations("app")
  const tCommon = useTranslations("common")
  const currentPage = currentPageFor(pathname)
  const groupLabel = currentPage ? t(`groups.${currentPage.group}`) : null
  const pageTitle = currentPage ? t(`pages.${currentPage.name}`) : APP_NAME
  const paletteShortcut = isMac ? t("palette.macShortcut") : t("palette.shortcut")
  const chatShortcut = isMac ? "⌘J" : "Ctrl+J"

  return (
    <header
      className={cn(
        "relative flex h-14 shrink-0 items-center gap-1.5 border-b border-line-subtle bg-surface/90 backdrop-blur-md sm:gap-2",
        splitChatOpen ? SPLIT_CHAT_GUTTER : WORKSPACE_GUTTER,
      )}
    >
      <Button
        variant="icon"
        size="small"
        icon={<PanelLeft />}
        aria-label={tCommon("ui.toggleSidebar")}
        onClick={onToggleSidebar}
        className="-ms-1 shrink-0"
      />
      <Separator orientation="vertical" className="mx-0.5 h-4 sm:mx-1" />
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        {groupLabel && (
          <>
            <span className="hidden truncate text-fg-secondary sm:inline">{groupLabel}</span>
            <ChevronRight className="hidden size-3.5 shrink-0 text-fg-tertiary sm:inline" aria-hidden="true" />
          </>
        )}
        <span className="truncate font-semibold text-fg">{pageTitle}</span>
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          variant="secondary"
          size="small"
          onClick={onOpenPalette}
          aria-label={t("palette.open")}
          icon={<Search />}
          className="px-2 sm:px-2.5"
        >
          <span className="hidden lg:inline">{t("palette.open")}</span>
          <Kbd className="hidden md:inline-flex">{paletteShortcut}</Kbd>
        </Button>

        <Link
          href={`${ROUTES.expenses}?add=1`}
          aria-label={t("topBar.addExpense")}
          className={linkButtonClass({ variant: "primary", size: "small", className: "px-2 sm:px-2.5" })}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("topBar.addExpense")}</span>
        </Link>

        <Button
          variant={chatOpen ? "primary" : "secondary"}
          size="small"
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          aria-label={t("assistant.open")}
          title={t("topBar.assistantShortcut", { shortcut: chatShortcut })}
          icon={<Sparkles />}
          className="px-2 sm:px-2.5"
        >
          <span className="hidden sm:inline">{t("assistant.open")}</span>
        </Button>
      </div>
      <NavProgressBar />
    </header>
  )
}

/**
 * The frame around every signed-in page: collapsible desktop sidebar / mobile drawer, contextual top bar with quick
 * actions, progressive workspace gutters, welcome dialog, and Assistant drawer or ResizablePanels split view.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  useSyncUserLanguage()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const compactChat = useMediaQuery(COMPACT_CHAT_QUERY)
  const compactNav = useMediaQuery(COMPACT_NAV_QUERY)
  const isMac = useIsApplePlatform()
  const t = useTranslations("app")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const splitChatOpen = chatOpen && !compactChat

  useEffect(() => {
    function handleShortcuts(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) return
      const key = event.key.toLowerCase()
      if (key === "j") {
        event.preventDefault()
        setChatOpen((open) => !open)
      } else if (key === "b") {
        event.preventDefault()
        if (window.matchMedia(COMPACT_NAV_QUERY).matches) {
          setMobileNavOpen((open) => !open)
        } else {
          setSidebarCollapsed((collapsed) => !collapsed)
        }
      }
    }
    window.addEventListener("keydown", handleShortcuts)
    return () => window.removeEventListener("keydown", handleShortcuts)
  }, [])

  function handleToggleSidebar() {
    if (compactNav) {
      setMobileNavOpen((open) => !open)
    } else {
      setSidebarCollapsed((collapsed) => !collapsed)
    }
  }

  const panel = (
    <ErrorBoundary
      fallback={(error, reset) => (
        <SectionError title={t("errors.assistant")} message={messageOf(error)} onRetry={reset} />
      )}
    >
      <ChatPanel onClose={() => setChatOpen(false)} />
    </ErrorBoundary>
  )

  const pageBody = (
    <div className={cn("h-full overflow-auto py-4 sm:py-6", splitChatOpen ? SPLIT_CHAT_GUTTER : WORKSPACE_GUTTER)}>
      <Page>{children}</Page>
    </div>
  )

  return (
    <div className="flex h-svh w-full overflow-hidden bg-canvas text-fg">
      <aside
        className={cn(
          "hidden shrink-0 border-e border-line-subtle bg-surface transition-[width] duration-200 md:block",
          sidebarCollapsed ? "w-16" : "w-64",
        )}
      >
        <AppSidebar collapsed={sidebarCollapsed} />
      </aside>

      <Drawer
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        title={tCommon("ui.sidebarTitle")}
        hideTitle
        side="start"
        padding="none"
        className="w-[min(18rem,85vw)]"
      >
        <AppSidebar collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
      </Drawer>

      <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar
          chatOpen={chatOpen}
          splitChatOpen={splitChatOpen}
          isMac={isMac}
          onToggleSidebar={handleToggleSidebar}
          onToggleChat={() => setChatOpen((open) => !open)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onToggleChat={() => setChatOpen((open) => !open)}
        />
        <WelcomeDialog onOpenChat={() => setChatOpen(true)} />

        {compactChat ? (
          <>
            <div className="min-h-0 flex-1 overflow-hidden">{pageBody}</div>
            <Drawer
              open={chatOpen}
              onOpenChange={setChatOpen}
              title={t("assistant.title")}
              hideTitle
              side="end"
              padding="none"
              className="w-full sm:w-[min(28rem,92vw)]"
            >
              {panel}
            </Drawer>
          </>
        ) : chatOpen ? (
          <ResizablePanels
            orientation="horizontal"
            className="min-h-0 flex-1"
            labels={{ resize: () => tCommon("ui.resizePanels") }}
            panels={[
              { id: "page", defaultSize: 66, minSize: 40, content: pageBody },
              { id: "chat", defaultSize: 34, minSize: 25, content: panel },
            ]}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden">{pageBody}</div>
        )}
      </div>
    </div>
  )
}
