// The sidebar footer's account menu: who is signed in, a shortcut to Settings, and Sign out. Part of the auth feature
// (components/); the sidebar (app/_frame/app-sidebar.tsx) draws it. Signing out is a navigation to the server's logout
// link, which ends the session there and at the provider (D186), so the page unloads cleanly.

import { ChevronsUpDown, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { ROUTES } from "@/shared/config/routes"
import { reportUnexpected } from "@/shared/lib/errors"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

import { useSignedInUser } from "../queries"
import { ownSitePath } from "../sign-in-urls"
import { broadcastSessionChange } from "../use-session-sync"
import { UserAvatar } from "./user-avatar"

// For the browser console only (developers): the server sent a sign-out link that leaves this site.
const FOREIGN_SIGN_OUT_LINK = "The sign-out link isn't on this site, so it wasn't followed."

// Leaves for the server's sign-out link, which ends the session here and at the provider. The link is the server's
// answer, so it's followed only if it stays on this site; anything else is a bug worth reporting, never a navigation.
function signOut(logoutUrl: string): void {
  const path = ownSitePath(logoutUrl, window.location.origin)
  if (path) {
    broadcastSessionChange()
    window.location.assign(path)
  } else {
    reportUnexpected(new Error(FOREIGN_SIGN_OUT_LINK))
  }
}

/** The person's picture and name; opened, their email, Settings link, and Sign out. Nothing while signed out. */
export function UserMenu() {
  const t = useTranslations("auth")
  const user = useSignedInUser().data
  if (!user) return null
  const name = user.name ?? user.email ?? t("userMenu.you")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("userMenu.label", { name })}
          className="h-9 min-w-0 flex-1 justify-start gap-2 px-1.5 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <UserAvatar name={name} picture={user.avatar_url} />
          <span className="min-w-0 flex-1 truncate text-left text-xs font-medium group-data-[collapsible=icon]:hidden">
            {name}
          </span>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-xs text-muted-foreground">{t("userMenu.signedInAs")}</p>
          <p className="truncate font-medium text-foreground">{name}</p>
          {user.email && user.email !== name && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.settings}>
            <Settings /> {t("userMenu.settings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => signOut(user.logout_url)} variant="destructive">
          <LogOut /> {t("userMenu.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
