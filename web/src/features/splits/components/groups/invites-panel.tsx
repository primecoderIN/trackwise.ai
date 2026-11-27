// Owner-only invite link manager for Shared groups: create general or guest-targeted links, copy once, revoke.

import { Check, Copy, Link2, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { SPLITS } from "@/shared/api/contracts.gen"
import { ROUTES } from "@/shared/config/routes"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

import type { CreatedGroupInvite, GroupInvite, GroupMember } from "../../api"
import { useCreateGroupInvite, useRevokeGroupInvite } from "../../queries"

const ANY_TARGET = "any"

/** Props for the Shared group invite management panel. */
export interface InvitesPanelProps {
  groupId: number
  members: readonly GroupMember[]
  invites: readonly GroupInvite[]
  archived: boolean
}

/** Generates expiring, revocable invite links (shown once on creation) and lists active/ended invites. */
export function InvitesPanel({ groupId, members, invites, archived }: InvitesPanelProps) {
  const t = useTranslations("splits")
  const { formatDate } = useFormatters()
  const messageOf = useMessageOf()
  const createInvite = useCreateGroupInvite()
  const revokeInvite = useRevokeGroupInvite()

  const unclaimedGuests = members.filter((m) => m.is_active && !m.is_registered)
  const [target, setTarget] = useState(ANY_TARGET)
  const [days, setDays] = useState(String(SPLITS.defaultInviteLifetimeDays))
  const [maxUses, setMaxUses] = useState("5")
  const [fresh, setFresh] = useState<CreatedGroupInvite | null>(null)
  const [copied, setCopied] = useState(false)

  const inviteUrl =
    fresh && typeof window !== "undefined" ? `${window.location.origin}${ROUTES.splitsJoin}/${fresh.token}` : ""

  async function handleGenerate() {
    try {
      const targetId = target === ANY_TARGET ? null : Number(target)
      const created = await createInvite.mutateAsync({
        groupId,
        body: {
          target_member_id: targetId,
          lifetime_days: Number(days) as 1 | 7 | 30,
          max_uses: targetId ? 1 : Number(maxUses),
        },
      })
      setFresh(created)
      setCopied(false)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success(t("invites.copied"))
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(inviteUrl)
    }
  }

  async function handleRevoke(inviteId: number) {
    try {
      await revokeInvite.mutateAsync({ groupId, inviteId })
      toast.success(t("invites.revoked"))
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="size-4" />
          {t("invites.title")}
        </CardTitle>
        <CardDescription>{t("invites.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!archived && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1 basis-44">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t("invites.targetLabel")}</p>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger aria-label={t("invites.targetLabel")} className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_TARGET}>{t("invites.anyMember")}</SelectItem>
                  {unclaimedGuests.map((guest) => (
                    <SelectItem key={guest.id} value={String(guest.id)}>
                      {t("invites.claimGuestOption", { name: guest.display_name })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-28">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t("invites.lifetimeLabel")}</p>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger aria-label={t("invites.lifetimeLabel")} className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPLITS.inviteLifetimeDays.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {t("invites.daysOption", { days: d })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {target === ANY_TARGET && (
              <div className="w-full sm:w-24">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t("invites.maxUsesLabel")}</p>
                <Select value={maxUses} onValueChange={setMaxUses}>
                  <SelectTrigger aria-label={t("invites.maxUsesLabel")} className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["1", "5", "10", "20"].map((count) => (
                      <SelectItem key={count} value={count}>
                        {count}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button size="sm" disabled={createInvite.isPending} onClick={() => void handleGenerate()}>
              {createInvite.isPending ? t("invites.generating") : t("invites.generate")}
            </Button>
          </div>
        )}

        {fresh && inviteUrl && (
          <div className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 p-3">
            <p className="text-xs font-medium">{t("invites.oneTimeNotice")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs">{inviteUrl}</code>
              <Button size="sm" variant="default" className="shrink-0" onClick={() => void handleCopy()}>
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {t("invites.copyLink")}
              </Button>
            </div>
          </div>
        )}

        {invites.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("invites.empty")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={inv.active ? "default" : "secondary"}>
                    {inv.active ? t("invites.activeBadge") : t("invites.inactiveBadge")}
                  </Badge>
                  <code className="text-muted-foreground">…{inv.hint}</code>
                  {inv.target_member_name && (
                    <Badge variant="outline">{t("invites.targetBadge", { name: inv.target_member_name })}</Badge>
                  )}
                  <span className="text-muted-foreground">
                    {t("invites.usesSummary", {
                      used: inv.use_count,
                      max: inv.max_uses,
                      date: formatDate(inv.expires_at),
                    })}
                  </span>
                </div>
                {inv.active && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-destructive"
                    disabled={revokeInvite.isPending}
                    onClick={() => void handleRevoke(inv.id)}
                  >
                    <Trash2 className="size-3.5" />
                    {t("invites.revoke")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
