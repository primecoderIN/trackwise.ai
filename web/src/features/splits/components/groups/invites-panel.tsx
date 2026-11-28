// Owner-only invite link manager for Shared groups: create general or guest-targeted links, copy once, revoke.

import { Button, Card, SelectField, StatusBadge, Tag, type SelectOption } from "@primecoderin/fast-ui-react"
import { Check, Copy, Link2, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { SPLITS } from "@/shared/api/contracts.gen"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { ROUTES } from "@/shared/config/routes"
import { toast } from "@/shared/lib/toast"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { CreatedGroupInvite, GroupInvite, GroupMember } from "../../api"
import { useCreateGroupInvite, useRevokeGroupInvite } from "../../queries"

const ANY_TARGET = "any"
const MAX_USE_OPTIONS: SelectOption[] = ["1", "5", "10", "20"].map((count) => ({ value: count, label: count }))

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

  const targetOptions = useMemo<SelectOption[]>(
    () => [
      { value: ANY_TARGET, label: t("invites.anyMember") },
      ...unclaimedGuests.map((guest) => ({
        value: String(guest.id),
        label: t("invites.claimGuestOption", { name: guest.display_name }),
      })),
    ],
    [t, unclaimedGuests],
  )

  const lifetimeOptions = useMemo<SelectOption[]>(
    () => SPLITS.inviteLifetimeDays.map((d) => ({ value: String(d), label: t("invites.daysOption", { days: d }) })),
    [t],
  )

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
              <SelectField
                label={t("invites.targetLabel")}
                options={targetOptions}
                value={target}
                onValueChange={setTarget}
                size="small"
              />
            </div>
            <div className="w-full sm:w-28">
              <SelectField
                label={t("invites.lifetimeLabel")}
                options={lifetimeOptions}
                value={days}
                onValueChange={setDays}
                size="small"
              />
            </div>
            {target === ANY_TARGET && (
              <div className="w-full sm:w-24">
                <SelectField
                  label={t("invites.maxUsesLabel")}
                  options={MAX_USE_OPTIONS}
                  value={maxUses}
                  onValueChange={setMaxUses}
                  size="small"
                />
              </div>
            )}
            <Button
              variant="primary"
              size="small"
              isLoading={createInvite.isPending}
              onClick={() => void handleGenerate()}
            >
              {createInvite.isPending ? t("invites.generating") : t("invites.generate")}
            </Button>
          </div>
        )}

        {fresh && inviteUrl && (
          <div className="flex flex-col gap-2 rounded-md border border-primary-active/40 bg-primary-light p-3">
            <p className="text-xs font-medium text-fg">{t("invites.oneTimeNotice")}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-surface px-2 py-1 text-xs">{inviteUrl}</code>
              <Button
                size="small"
                variant="primary"
                icon={copied ? <Check /> : <Copy />}
                className="shrink-0"
                onClick={() => void handleCopy()}
              >
                {t("invites.copyLink")}
              </Button>
            </div>
          </div>
        )}

        {invites.length === 0 ? (
          <p className="text-xs text-fg-secondary">{t("invites.empty")}</p>
        ) : (
          <ul className="divide-y divide-line-subtle rounded-md border border-line">
            {invites.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={inv.active ? "success" : "neutral"}>
                    {inv.active ? t("invites.activeBadge") : t("invites.inactiveBadge")}
                  </StatusBadge>
                  <code className="text-fg-secondary">…{inv.hint}</code>
                  {inv.target_member_name && <Tag>{t("invites.targetBadge", { name: inv.target_member_name })}</Tag>}
                  <span className="text-fg-secondary">
                    {t("invites.usesSummary", {
                      used: inv.use_count,
                      max: inv.max_uses,
                      date: formatDate(inv.expires_at),
                    })}
                  </span>
                </div>
                {inv.active && (
                  <Button
                    size="small"
                    variant="subtle"
                    icon={<Trash2 />}
                    className="text-destructive hover:text-destructive"
                    disabled={revokeInvite.isPending}
                    onClick={() => void handleRevoke(inv.id)}
                  >
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
