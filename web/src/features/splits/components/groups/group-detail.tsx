// Full detail view of one Personal or Shared group: members, net balances, simplified settlements, invites, and ledger.

import { Button, Card, SkeletonItem, Tag } from "@primecoderin/fast-ui-react"
import { CardContent, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { toast } from "@/shared/lib/toast"
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowRightLeft,
  LogOut,
  Pencil,
  Plus,
  Share2,
  Trash2,
  User,
  Users,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { SectionError } from "@/shared/components/section-error"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { SimplifiedTransfer, SplitContact, SplitExpense } from "../../api"
import { useDeleteGroup, useGroupDetail, useLeaveGroup, useUpdateGroup } from "../../queries"
import { ActivityList } from "../activity/activity-list"
import { ConfirmActionDialog } from "../dialogs/confirm-action-dialog"
import { GroupDialog } from "../dialogs/group-dialog"
import type { PaymentReminderTarget } from "../dialogs/payment-qr-dialog"
import type { SettlePreset } from "../dialogs/settle-up-dialog"
import { TransferOwnershipDialog } from "../dialogs/transfer-ownership-dialog"
import { InvitesPanel } from "./invites-panel"
import { SimplifiedTransfers } from "./simplified-transfers"

/** Props for the single-group detail screen inside /splits. */
export interface GroupDetailViewProps {
  groupId: number
  contacts: readonly SplitContact[]
  onBack: () => void
  onAddSplit: (groupId: number, groupName: string, members: GroupDetail["members"], defaultCurrency?: string) => void
  onEditSplit: (split: SplitExpense, members: GroupDetail["members"]) => void
  onLogMyShare: (split: SplitExpense) => void
  onSettlePreset: (preset: SettlePreset) => void
  onRemindTarget: (target: PaymentReminderTarget, settlePreset: SettlePreset) => void
}

type GroupDetail = NonNullable<ReturnType<typeof useGroupDetail>["data"]>

/** Renders one Personal or Shared group's balances, simplified transfers, invites, member controls, and activity. */
export function GroupDetailView({
  groupId,
  contacts,
  onBack,
  onAddSplit,
  onEditSplit,
  onLogMyShare,
  onSettlePreset,
  onRemindTarget,
}: GroupDetailViewProps) {
  const t = useTranslations("splits")
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const query = useGroupDetail(groupId)
  const updateGroup = useUpdateGroup()
  const deleteGroup = useDeleteGroup()
  const leaveGroup = useLeaveGroup()

  const [editOpen, setEditOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [confirmKind, setConfirmKind] = useState<"upgrade" | "delete" | "leave" | null>(null)

  if (query.isError && !query.data) {
    return (
      <div className="flex flex-col gap-3">
        <Button variant="subtle" size="small" className="w-fit" onClick={onBack}>
          <ArrowLeft className="size-4" />
          {t("groups.back")}
        </Button>
        <SectionError
          title={t("page.loadFailed")}
          message={messageOf(query.error)}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    )
  }

  if (!query.data) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonItem className="h-10 w-40" />
        <SkeletonItem className="h-44" />
        <SkeletonItem className="h-64" />
      </div>
    )
  }

  const detail = query.data
  const { group } = detail
  const isOwner = group.my_role === "owner"
  const isShared = group.kind === "shared"
  const archived = Boolean(group.archived_at)

  function presetFromTransfer(tr: SimplifiedTransfer): SettlePreset {
    return {
      groupId: group.id,
      groupName: group.name,
      groupMembers: detail.members,
      fromKey: `m:${tr.from_member_id}`,
      toKey: `m:${tr.to_member_id}`,
      currency: tr.currency,
      amountMajor: String(tr.amount),
      outstandingMinor: tr.amount_minor,
    }
  }

  async function handleToggleArchive() {
    try {
      await updateGroup.mutateAsync({ groupId: group.id, body: { archived: !archived } })
      toast.success(t("groups.updated"))
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  async function handleConfirmed() {
    try {
      if (confirmKind === "upgrade") {
        await updateGroup.mutateAsync({ groupId: group.id, body: { upgrade_to_shared: true } })
        toast.success(t("groups.updated"))
      } else if (confirmKind === "delete") {
        await deleteGroup.mutateAsync(group.id)
        toast.success(t("groups.deleted"))
        onBack()
      } else if (confirmKind === "leave") {
        await leaveGroup.mutateAsync(group.id)
        toast.success(t("groups.left"))
        onBack()
      }
      setConfirmKind(null)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  async function handleRemoveMember(memberId: number) {
    try {
      await updateGroup.mutateAsync({ groupId: group.id, body: { remove_member_ids: [memberId] } })
      toast.success(t("groups.updated"))
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="subtle" size="small" onClick={onBack}>
            <ArrowLeft className="size-4" />
            {t("groups.back")}
          </Button>
          <h2 className="text-xl font-semibold">{group.name}</h2>
          <Tag tone={isShared ? "brand" : "neutral"} className="gap-1">
            {isShared ? <Users className="size-3" /> : <User className="size-3" />}
            {isShared ? t("groups.shared") : t("groups.personal")}
          </Tag>
          {archived && <Tag>{t("groups.archivedBadge")}</Tag>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!archived && (
            <Button
              variant="primary"
              size="small"
              onClick={() => onAddSplit(group.id, group.name, detail.members, group.default_currency ?? undefined)}
            >
              <Plus className="size-4" />
              {t("page.addSplit")}
            </Button>
          )}
          {isOwner && !archived && (
            <Button size="small" variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3.5" />
              {t("groups.editGroup")}
            </Button>
          )}
          {isOwner && !isShared && !archived && (
            <Button size="small" variant="secondary" onClick={() => setConfirmKind("upgrade")}>
              <Share2 className="size-3.5" />
              {t("groups.upgradeToShared")}
            </Button>
          )}
          {isOwner && isShared && !archived && (
            <Button size="small" variant="secondary" onClick={() => setTransferOpen(true)}>
              <ArrowRightLeft className="size-3.5" />
              {t("groups.transferOwnership")}
            </Button>
          )}
          {isOwner && (
            <Button
              size="small"
              variant="subtle"
              disabled={updateGroup.isPending}
              onClick={() => void handleToggleArchive()}
            >
              {archived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
              {archived ? t("groups.unarchive") : t("groups.archive")}
            </Button>
          )}
          {isOwner && detail.splits.length === 0 && detail.settlements.length === 0 && (
            <Button size="small" variant="subtle" className="text-destructive" onClick={() => setConfirmKind("delete")}>
              <Trash2 className="size-3.5" />
              {t("groups.deleteGroup")}
            </Button>
          )}
          {!isOwner && isShared && (
            <Button size="small" variant="secondary" onClick={() => setConfirmKind("leave")}>
              <LogOut className="size-3.5" />
              {t("groups.leaveGroup")}
            </Button>
          )}
        </div>
      </div>

      {archived && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {t("groups.archivedBanner")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SimplifiedTransfers
          transfers={detail.simplified_transfers}
          archived={archived}
          onSettle={(tr) => onSettlePreset(presetFromTransfer(tr))}
          onRemind={(tr) =>
            onRemindTarget(
              {
                fromName: tr.from_is_self ? t("groups.youTag") : tr.from_name,
                toName: tr.to_is_self ? t("groups.youTag") : tr.to_name,
                toUpiId: tr.to_upi_id,
                amountMajor: String(tr.amount),
                currency: tr.currency,
                contextLabel: group.name,
                counterpartyName: tr.from_is_self ? tr.to_name : tr.from_name,
              },
              presetFromTransfer(tr),
            )
          }
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("groups.membersTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {detail.members.map((member) => {
                const balances = detail.member_balances.filter((b) => b.member_id === member.id)
                return (
                  <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{member.display_name}</span>
                      {member.is_self && <Tag>{t("groups.youTag")}</Tag>}
                      {member.role === "owner" && <Tag>{t("groups.ownerTag")}</Tag>}
                      {!member.is_registered && <Tag>{t("groups.guestTag")}</Tag>}
                      {!member.is_active && <Tag>{t("groups.formerTag")}</Tag>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {balances.length === 0 ? (
                        <span className="text-xs text-muted-foreground">{t("groups.settled")}</span>
                      ) : (
                        balances.map((b) => (
                          <span
                            key={b.currency}
                            className={`text-xs font-medium ${
                              b.net_minor > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {b.net_minor > 0 ? `+${formatMoney(b.net, b.currency)}` : formatMoney(b.net, b.currency)}
                          </span>
                        ))
                      )}
                      {isOwner && !archived && member.is_active && member.role !== "owner" && balances.length === 0 && (
                        <Button
                          size="small"
                          variant="subtle"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => void handleRemoveMember(member.id)}
                        >
                          {t("dialogs.group.removeMember")}
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      {isOwner && isShared && (
        <InvitesPanel groupId={group.id} members={detail.members} invites={detail.invites} archived={archived} />
      )}

      <ActivityList
        title={t("groups.activityTitle")}
        emptyDescription={t("groups.noActivity")}
        splits={detail.splits}
        settlements={detail.settlements}
        onEditSplit={(split) => onEditSplit(split, detail.members)}
        onLogMyShare={onLogMyShare}
      />

      <GroupDialog open={editOpen} contacts={contacts} editing={detail} onOpenChange={setEditOpen} />
      {isOwner && isShared && (
        <TransferOwnershipDialog open={transferOpen} detail={detail} onOpenChange={setTransferOpen} />
      )}
      <ConfirmActionDialog
        open={confirmKind !== null}
        title={
          confirmKind === "upgrade"
            ? t("groups.upgradeConfirmTitle", { name: group.name })
            : confirmKind === "delete"
              ? t("groups.deleteConfirmTitle", { name: group.name })
              : t("groups.leaveConfirmTitle", { name: group.name })
        }
        description={
          confirmKind === "upgrade"
            ? t("groups.upgradeConfirmBody")
            : confirmKind === "delete"
              ? t("groups.deleteConfirmBody")
              : t("groups.leaveConfirmBody")
        }
        destructive={confirmKind === "delete" || confirmKind === "leave"}
        pending={updateGroup.isPending || deleteGroup.isPending || leaveGroup.isPending}
        onConfirm={() => void handleConfirmed()}
        onOpenChange={(next) => !next && setConfirmKind(null)}
      />
    </div>
  )
}
