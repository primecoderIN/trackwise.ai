"use client"

// The frame around every signed-in page: the grouped sidebar (with user menu, language and theme in its footer), the
// top bar (sidebar toggle, current page title, command-palette button, Assistant button), the page area, the command
// palette (Ctrl/⌘ K), the first-run welcome dialog, and the assistant's chat panel (Phases 28 and 29).

import { MessageSquare, Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Suspense, useState, type ReactNode } from "react"

import { ChatPanel } from "@/features/assistant"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import { NavProgressBar } from "@/shared/components/nav-progress-bar"
import { SectionError } from "@/shared/components/section-error"
import { APP_NAME } from "@/shared/config/app"
import { useIsMobile } from "@/shared/hooks/use-mobile"
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

function Page({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations("app")
  const messageOf = useMessageOf()
  return (
    <ErrorBoundary
      key={pathname}
      fallback={(error, reset) => <SectionError title={t("errors.page")} message={messageOf(error)} onRetry={reset} />}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </ErrorBoundary>
  )
}

interface TopBarProps {
  chatOpen: boolean
  onToggleChat: () => void
  onOpenPalette: () => void
}

function TopBar({ chatOpen, onToggleChat, onOpenPalette }: TopBarProps) {
  const pathname = usePathname()
  const t = useTranslations("app")
  const currentPage = currentPageFor(pathname)
  const pageTitle = currentPage ? t(`pages.${currentPage.name}`) : APP_NAME
  const PageIcon = currentPage?.icon

  return (
    <header className="relative flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-4" />
      <div className="flex min-w-0 items-center gap-2">
        {PageIcon && <PageIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        <span className="truncate font-semibold tracking-tight">{pageTitle}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onOpenPalette} className="gap-2 text-muted-foreground">
          <Search className="size-3.5" />
          <span className="hidden sm:inline">{t("palette.open")}</span>
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-block">
            {t("palette.shortcut")}
          </kbd>
        </Button>
        <Button variant={chatOpen ? "default" : "secondary"} size="sm" onClick={onToggleChat} aria-pressed={chatOpen}>
          <MessageSquare /> {t("assistant.open")}
        </Button>
      </div>
      <NavProgressBar />
    </header>
  )
}

/**
 * The frame around every signed-in page: sidebar on the left, a top bar with the current page's title and command
 * palette trigger, the current page, the welcome flow dialog, and the assistant's chat panel on the right.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  useSyncUserLanguage()
  const [chatOpen, setChatOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const isMobile = useIsMobile()
  const t = useTranslations("app")
  const messageOf = useMessageOf()

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
      <SidebarInset className="h-svh overflow-hidden">
        <TopBar
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen((open) => !open)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onOpenChat={() => setChatOpen(true)} />
        <WelcomeDialog onOpenChat={() => setChatOpen(true)} />

        {isMobile ? (
          <>
            <div className="min-h-0 flex-1 overflow-auto p-4">
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
              <div className="h-full overflow-auto p-4 md:p-6">
                <Page>{children}</Page>
              </div>
            </ResizablePanel>
            {chatOpen && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel id="chat" defaultSize="32%" minSize="22%" maxSize="50%">
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
