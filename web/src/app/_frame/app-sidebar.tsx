"use client"

// The app's left-hand menu: the brand mark, grouped links to every page, and a responsive footer holding the user
// menu plus language and theme controls that collapse cleanly into the narrow icon rail. Part of app/_frame/.

import { Wallet } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { useUpdatePreferences } from "@/features/account"
import { UserMenu } from "@/features/auth"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { LanguageMenu, type Language } from "@/shared/i18n"
import { useMessageOf } from "@/shared/lib/use-message-of"
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

import { MENU_GROUPS } from "./pages"

/**
 * The grouped sidebar menu: Overview, Money, Insights and Settings, plus a footer that stacks cleanly when
 * collapsed into icon-rail mode.
 */
export function AppSidebar() {
  const pathname = usePathname()
  const t = useTranslations("app")
  const messageOf = useMessageOf()
  const updatePreferences = useUpdatePreferences()

  function persistLanguage(next: Language) {
    updatePreferences.mutate({ preferred_language: next }, { onError: (error) => toast.error(messageOf(error)) })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2.5 pt-3 pb-2">
        <Link
          href={ROUTES.dashboard}
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 font-semibold outline-hidden ring-sidebar-ring transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xs">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate text-[0.95rem] tracking-tight group-data-[collapsible=icon]:hidden">
            {APP_NAME}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1.5">
        {MENU_GROUPS.map((group) => (
          <SidebarGroup key={group.name} className="py-1.5">
            <SidebarGroupLabel className="px-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground/75 uppercase">
              {t(`groups.${group.name}`)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.pages.map((item) => {
                  const active = pathname === item.path || pathname.startsWith(`${item.path}/`)
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={t(`pages.${item.name}`)}
                        className="h-9 rounded-lg px-2.5 text-muted-foreground transition-colors hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary"
                      >
                        <Link href={item.path}>
                          <item.icon className={active ? "text-primary" : undefined} />
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
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
          <UserMenu />
          <div className="flex shrink-0 items-center gap-0.5 group-data-[collapsible=icon]:flex-col">
            <LanguageMenu onSelect={persistLanguage} />
            <ModeToggle />
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
