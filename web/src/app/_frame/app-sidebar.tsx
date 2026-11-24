// The app's left-hand menu: the app's name, grouped links to every page, and a footer with language, theme and the
// signed-in person's account menu (Phase 28). Part of the app composition (app/_frame/), drawn by AppLayout.

import { Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import { useUpdatePreferences } from "@/features/account"
import { UserMenu } from "@/features/auth"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { LanguageMenu, type Language } from "@/shared/i18n"
import { messageOf } from "@/shared/lib/errors"
import { ModeToggle } from "@/shared/theme"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar"

import { useTexts } from "../_i18n"
import { MENU_GROUPS } from "./pages"

/**
 * The grouped sidebar menu: Overview, Money, Insights and Settings, plus the footer holding the user menu and the
 * language and theme toggles.
 */
export function AppSidebar() {
  const pathname = usePathname()
  const { t } = useTexts()
  const updatePreferences = useUpdatePreferences()

  function persistLanguage(next: Language) {
    updatePreferences.mutate({ preferred_language: next }, { onError: (error) => toast.error(messageOf(error)) })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href={ROUTES.dashboard}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 font-semibold outline-hidden ring-sidebar-ring focus-visible:ring-2"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate tracking-tight group-data-[collapsible=icon]:hidden">{APP_NAME}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {MENU_GROUPS.map((group) => (
          <SidebarGroup key={group.name}>
            <SidebarGroupLabel>{t(`groups.${group.name}`)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.pages.map((item) => {
                  const active = pathname === item.path || pathname.startsWith(`${item.path}/`)
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={active} tooltip={t(`pages.${item.name}`)}>
                        <Link href={item.path}>
                          <item.icon />
                          <span>{t(`pages.${item.name}`)}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <UserMenu />
          <div className="flex items-center gap-0.5">
            <LanguageMenu onSelect={persistLanguage} />
            <ModeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
