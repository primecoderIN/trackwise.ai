// One row of "Where you're signed in": device-aware icon (phone vs desktop), browser & OS, timestamps, and Sign out.
// Part of the account feature (components/sessions/). Used by sessions-card.tsx.

import { Button, StatusBadge } from "@primecoderin/fast-ui-react"
import { toast } from "@/shared/lib/toast"
import { Monitor, Smartphone } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { Session } from "../../api"
import { deviceOf } from "../../device-name"
import { useSignOutSession } from "../../queries"

/**
 * The session's browser and system, marked if it's this browser, with a device-appropriate icon and remote sign-out.
 */
export function SessionRow({ session }: { session: Session }) {
  const t = useTranslations("account")
  const messageOf = useMessageOf()
  const { formatDateTime } = useFormatters()
  const signOut = useSignOutSession()
  const { browser, system } = deviceOf(session.user_agent)
  const device =
    browser && system ? t("sessions.deviceOn", { browser, system }) : (browser ?? system ?? t("sessions.unknownDevice"))
  const signedIn = formatDateTime(session.created_at)
  const isPhone = system === "iOS" || system === "Android"
  const DeviceIcon = isPhone ? Smartphone : Monitor

  function handleSignOut() {
    signOut.mutate(session.id, {
      onSuccess: () => toast.success(t("sessions.signedOut")),
      onError: (error) => toast.error(messageOf(error)),
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3.5 py-3.5 first:pt-1 last:pb-1">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          session.current ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <DeviceIcon aria-hidden="true" className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
          <span>{device}</span>
          {session.current && <StatusBadge tone="success">{t("sessions.thisBrowser")}</StatusBadge>}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("sessions.times", { signedIn, lastActive: formatDateTime(session.last_active_at) })}
        </p>
      </div>
      {!session.current && (
        <Button
          variant="secondary"
          size="small"
          disabled={signOut.isPending}
          aria-label={t("sessions.signOutLabel", { device, signedIn })}
          onClick={handleSignOut}
        >
          {t("sessions.signOut")}
        </Button>
      )}
    </li>
  )
}
