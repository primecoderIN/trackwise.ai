// The sidebar footer's account menu: who is signed in, a shortcut to Settings, and Sign out. Part of the auth feature
// (components/); the sidebar (app/_frame/app-sidebar.tsx) draws it. Signing out is a navigation to the server's logout
// link, which ends the session there and at the provider (D186), so the page unloads cleanly.

import { Button, Menu, MenuItem, MenuLinkItem, MenuSeparator } from "@primecoderin/fast-ui-react"
import { ChevronsUpDown, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { ROUTES } from "@/shared/config/routes"
import { reportUnexpected } from "@/shared/lib/errors"
import { cn } from "@/shared/lib/utils"

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

/**
 * The person's picture and name; opened, their email, Settings link, and Sign out. Nothing while signed out.
 * `compact` shows only the picture, for the sidebar's narrow icon rail.
 */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("auth")
  const user = useSignedInUser().data
  if (!user) return null
  const name = user.name ?? user.email ?? t("userMenu.you")

  return (
    <Menu
      align="start"
      trigger={
        <Button
          variant="subtle"
          size="small"
          aria-label={t("userMenu.label", { name })}
          className={cn("h-9 min-w-0 justify-start gap-2 px-1.5", compact ? "size-9 justify-center px-0" : "flex-1")}
        >
          <UserAvatar name={name} picture={user.avatar_url} />
          {!compact && (
            <>
              <span className="min-w-0 flex-1 truncate text-start text-xs font-medium">{name}</span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />
            </>
          )}
        </Button>
      }
    >
      <div className="min-w-48 px-3 py-2">
        <p className="text-xs text-fg-secondary">{t("userMenu.signedInAs")}</p>
        <p className="truncate text-sm font-medium text-fg">{name}</p>
        {user.email && user.email !== name && <p className="truncate text-xs text-fg-secondary">{user.email}</p>}
      </div>
      <MenuSeparator />
      <MenuLinkItem icon={<Settings />} render={<Link href={ROUTES.settings} />}>
        {t("userMenu.settings")}
      </MenuLinkItem>
      <MenuItem icon={<LogOut />} tone="danger" onClick={() => signOut(user.logout_url)}>
        {t("userMenu.signOut")}
      </MenuItem>
    </Menu>
  )
}
