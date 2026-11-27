"use client"

// The frame around every signed-in page: grouped sidebar, sleek top bar (contextual breadcrumb, search palette,
// global Add Expense CTA, and Assistant toggle with Ctrl/⌘+J), progressive full-width page viewport (up to 10rem
// wide-desktop side padding) with skeleton fallback, command palette (Ctrl/⌘+K), welcome stepper dialog, and
// responsive Assistant sheet (mobile/tablet) or resizable split panel (desktop).

import { ChevronRight, Plus, Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Suspense, useEffect, useState, useSyncExternalStore, type ReactNode } from "react"

import { ChatPanel } from "@/features/assistant"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import { NavProgressBar } from "@/shared/components/nav-progress-bar"
import { PageSkeleton } from "@/shared/components/page-skeleton"
import { SectionError } from "@/shared/components/section-error"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/shared/ui/resizable"
import { Separator } from "@/shared/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar"

import { AppSidebar } from "./app-sidebar"
import { CommandPalette } from "./command-palette"
import { currentPageFor } from "./pages"
import { useSyncUserLanguage } from "./use-sync-user-language"
import { WelcomeDialog } from "./welcome-dialog"

const NOOP_SUBSCRIBE = () => () => {}
const COMPACT_CHAT_QUERY = "(max-width: 1023px)"
const WORKSPACE_GUTTER = "px-4 sm:px-6 lg:px-10 xl:px-20 2xl:px-40"
const SPLIT_CHAT_GUTTER = "px-4 sm:px-6 lg:px-8"

function subscribeCompactChat(onChange: () => void): () => void {
  const query = window.matchMedia(COMPACT_CHAT_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useCompactChatSheet(): boolean {
  return useSyncExternalStore(
    subscribeCompactChat,
    () => window.matchMedia(COMPACT_CHAT_QUERY).matches,
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
  onToggleChat: () => void
  onOpenPalette: () => void
}

function TopBar({ chatOpen, splitChatOpen, isMac, onToggleChat, onOpenPalette }: TopBarProps) {
  const pathname = usePathname()
  const t = useTranslations("app")
  const currentPage = currentPageFor(pathname)
  const groupLabel = currentPage ? t(`groups.${currentPage.group}`) : null
  const pageTitle = currentPage ? t(`pages.${currentPage.name}`) : APP_NAME
  const paletteShortcut = isMac ? t("palette.macShortcut") : t("palette.shortcut")
  const chatShortcut = isMac ? "⌘J" : "Ctrl+J"

  return (
    <header
      className={`relative flex h-14 shrink-0 items-center gap-1.5 border-b border-border/80 bg-background/85 backdrop-blur-md sm:gap-2 ${
        splitChatOpen ? SPLIT_CHAT_GUTTER : WORKSPACE_GUTTER
      }`}
    >
      <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mx-0.5 h-4 sm:mx-1" />
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        {groupLabel && (
          <>
            <span className="hidden truncate text-muted-foreground sm:inline">{groupLabel}</span>
            <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:inline" aria-hidden="true" />
          </>
        )}
        <span className="truncate font-medium text-foreground">{pageTitle}</span>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPalette}
          aria-label={t("palette.open")}
          className="h-8 gap-2 bg-card/80 px-2 text-muted-foreground hover:text-foreground sm:px-2.5"
        >
          <Search className="size-3.5" aria-hidden="true" />
          <span className="hidden lg:inline">{t("palette.open")}</span>
          <kbd className="hidden rounded-md border bg-muted/70 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-block">
            {paletteShortcut}
          </kbd>
        </Button>

        <Button asChild size="sm" className="h-8 gap-1.5 px-2 sm:px-2.5">
          <Link href={`${ROUTES.expenses}?add=1`} aria-label={t("topBar.addExpense")}>
            <Plus className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{t("topBar.addExpense")}</span>
          </Link>
        </Button>

        <Button
          variant={chatOpen ? "default" : "outline"}
          size="sm"
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          aria-label={t("assistant.open")}
          title={t("topBar.assistantShortcut", { shortcut: chatShortcut })}
          className={chatOpen ? "h-8 gap-1.5 px-2 sm:px-2.5" : "h-8 gap-1.5 bg-card/80 px-2 sm:px-2.5"}
        >
          <Sparkles className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("assistant.open")}</span>
        </Button>
      </div>
      <NavProgressBar />
    </header>
  )
}

/**
 * The frame around every signed-in page: sidebar on the left, contextual top bar with quick actions, progressive
 * workspace gutters (up to 10rem on wide desktops), welcome dialog, and Assistant sheet or resizable split panel.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  useSyncUserLanguage()
  const [chatOpen, setChatOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const compactChat = useCompactChatSheet()
  const isMac = useIsApplePlatform()
  const t = useTranslations("app")
  const messageOf = useMessageOf()
  const splitChatOpen = chatOpen && !compactChat

  useEffect(() => {
    function handleChatShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault()
        setChatOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", handleChatShortcut)
    return () => window.removeEventListener("keydown", handleChatShortcut)
  }, [])

  const panel = (
    <ErrorBoundary
      fallback={(error, reset) => (
        <SectionError title={t("errors.assistant")} message={messageOf(error)} onRetry={reset} />
      )}
    >
      <ChatPanel onClose={() => setChatOpen(false)} />
    </ErrorBoundary>
  )

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh min-w-0 overflow-hidden">
        <TopBar
          chatOpen={chatOpen}
          splitChatOpen={splitChatOpen}
          isMac={isMac}
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
            <div className={`min-h-0 flex-1 overflow-auto py-4 sm:py-5 ${WORKSPACE_GUTTER}`}>
              <Page>{children}</Page>
            </div>
            <Sheet open={chatOpen} onOpenChange={setChatOpen}>
              <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-md">
                <SheetHeader className="sr-only">
                  <SheetTitle>{t("assistant.title")}</SheetTitle>
                  <SheetDescription>{t("assistant.description", { app: APP_NAME })}</SheetDescription>
                </SheetHeader>
                {panel}
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
            <ResizablePanel id="page" minSize="40%">
              <div
                className={`h-full overflow-auto py-5 sm:py-6 ${splitChatOpen ? SPLIT_CHAT_GUTTER : WORKSPACE_GUTTER}`}
              >
                <Page>{children}</Page>
              </div>
            </ResizablePanel>
            {chatOpen && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="chat" defaultSize="34%" minSize="25%" maxSize="50%">
                  {panel}
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}
