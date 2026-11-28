"use client"

// The app's left-hand navigation: the brand mark, grouped SideNav links to every page, and a responsive footer holding
// the user menu plus language and theme controls that collapse cleanly into the narrow icon rail. Part of app/_frame/.

import { SideNav, type SideNavSection, useAppToast } from "@primecoderin/fast-ui-react"
import { Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { useUpdatePreferences } from "@/features/account"
import { UserMenu } from "@/features/auth"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { LanguageMenu, type Language } from "@/shared/i18n"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { cn } from "@/shared/lib/utils"
import { ModeToggle } from "@/shared/theme"

import { currentPageFor, MENU_GROUPS } from "./pages"

interface AppSidebarProps {
  /** Whether the desktop sidebar is collapsed into its narrow icon rail. */
  collapsed?: boolean
  /** Called after choosing a navigation item (used to close the mobile drawer). */
  onNavigate?: () => void
}

/**
 * The grouped sidebar menu: Overview, Money, Insights and Settings, built on @primecoderin/fast-ui-react's SideNav,
 * plus a footer that stacks cleanly when collapsed into icon-rail mode.
 */
export function AppSidebar({ collapsed = false, onNavigate }: AppSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("app")
  const tCommon = useTranslations("common")
  const toast = useAppToast()
  const messageOf = useMessageOf()
  const updatePreferences = useUpdatePreferences()

  const activePage = currentPageFor(pathname)

  function persistLanguage(next: Language) {
    updatePreferences.mutate({ preferred_language: next }, { onError: (error) => toast.error(messageOf(error)) })
  }

  const sections = useMemo<SideNavSection[]>(
    () =>
      MENU_GROUPS.map((group) => ({
        id: group.name,
        label: t(`groups.${group.name}`),
        items: group.pages.map((item) => ({
          id: item.path,
          label: t(`pages.${item.name}`),
          icon: <item.icon />,
          render: <Link href={item.path} />,
        })),
      })),
    [t],
  )

  return (
    <div className="flex h-full flex-col bg-surface text-fg">
      <div className={cn("px-3 pt-3 pb-2", collapsed && "px-2")}>
        <Link
          href={ROUTES.dashboard}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-1.5 font-semibold text-fg transition-colors hover:bg-primary-light focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary shadow-primary">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          {!collapsed && <span className="truncate text-[0.95rem] tracking-tight">{APP_NAME}</span>}
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
        <SideNav
          sections={sections}
          current={activePage?.path}
          collapsed={collapsed}
          onNavigate={onNavigate}
          aria-label={tCommon("ui.sidebarTitle")}
        />
      </div>

      <div className="border-t border-line-subtle p-2">
        <div
          className={cn(
            "flex items-center justify-between gap-1",
            collapsed && "flex-col items-center justify-center gap-1.5",
          )}
        >
          <UserMenu compact={collapsed} />
          <div className={cn("flex shrink-0 items-center gap-0.5", collapsed && "flex-col")}>
            <LanguageMenu onSelect={persistLanguage} />
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
