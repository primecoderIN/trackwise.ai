// Chronological activity feed merging split expenses and active/soft-voided settlements with per-user expense links.

import { Ban, ExternalLink, Lock, Pencil, ReceiptText, Trash2, Unlink } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/shared/components/empty-state"
import { ROUTES } from "@/shared/config/routes"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import type { SplitExpense, SplitSettlement } from "../../api"
import { useDeleteSplitExpense, useUnlinkSplitExpense, useVoidSettlement } from "../../queries"
import { ConfirmActionDialog } from "../dialogs/confirm-action-dialog"

/** Props for the combined splits & settlements activity list. */
export interface ActivityListProps {
  title?: string
  emptyDescription?: string
  splits: readonly SplitExpense[]
  settlements: readonly SplitSettlement[]
  onEditSplit: (split: SplitExpense) => void
  onLogMyShare: (split: SplitExpense) => void
}

type FeedItem =
  | { kind: "split"; sortDate: string; createdAt: string; item: SplitExpense }
  | { kind: "settlement"; sortDate: string; createdAt: string; item: SplitSettlement }

/** Lists splits and active/voided settlements newest-first with edit/delete/void and private expense-link actions. */
export function ActivityList({
  title,
  emptyDescription,
  splits,
  settlements,
  onEditSplit,
  onLogMyShare,
}: ActivityListProps) {
  const t = useTranslations("splits")
  const { formatDate, formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const deleteSplit = useDeleteSplitExpense()
  const voidSettlement = useVoidSettlement()
  const unlink = useUnlinkSplitExpense()

  const [deletingSplit, setDeletingSplit] = useState<SplitExpense | null>(null)
  const [voiding, setVoiding] = useState<SplitSettlement | null>(null)

  const items: FeedItem[] = [
    ...splits.map((item): FeedItem => ({ kind: "split", sortDate: item.spent_on, createdAt: item.created_at, item })),
    ...settlements.map((item): FeedItem => ({
      kind: "settlement",
      sortDate: item.settled_on,
      createdAt: item.created_at,
      item,
    })),
  ].sort((a, b) => b.sortDate.localeCompare(a.sortDate) || b.createdAt.localeCompare(a.createdAt))

  async function confirmDeleteSplit() {
    if (!deletingSplit) return
    try {
      await deleteSplit.mutateAsync(deletingSplit.id)
      toast.success(t("activity.splitDeleted"))
      setDeletingSplit(null)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  async function confirmVoid() {
    if (!voiding) return
    try {
      await voidSettlement.mutateAsync(voiding.id)
      toast.success(t("activity.settlementVoided"))
      setVoiding(null)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  async function handleUnlink(splitId: number) {
    try {
      await unlink.mutateAsync(splitId)
      toast.success(t("activity.unlinked"))
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title ?? t("activity.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={t("activity.emptyTitle")}
            message={emptyDescription ?? t("activity.emptyDescription")}
          />
        ) : (
          <ul className="divide-y">
            {items.map((entry) => {
              if (entry.kind === "settlement") {
                const s = entry.item
                const fromLabel = s.from_is_self ? t("groups.youTag") : s.from_name
                const toLabel = s.to_is_self ? t("groups.youTag") : s.to_name
                const isVoided = Boolean(s.voided_at)
                return (
                  <li
                    key={`settlement-${s.id}`}
                    className={`flex flex-wrap items-center justify-between gap-2 py-3 text-sm ${isVoided ? "opacity-60" : ""}`}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{t("activity.settlementBadge")}</Badge>
                        {isVoided && <Badge variant="destructive">{t("activity.voidedBadge")}</Badge>}
                        <span className={isVoided ? "line-through" : "font-medium"}>
                          {t("activity.settlementLine", { from: fromLabel, to: toLabel })}
                        </span>
                        <span className={isVoided ? "line-through" : "font-semibold"}>
                          {formatMoney(s.amount, s.currency)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(s.settled_on)}
                        {s.group_name ? ` · ${s.group_name}` : ""}
                        {s.note ? ` · ${s.note}` : ""}
                      </p>
                    </div>
                    {s.can_void && (
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setVoiding(s)}>
                        <Ban className="size-3.5" />
                        {t("activity.voidAction")}
                      </Button>
                    )}
                  </li>
                )
              }

              const sp = entry.item
              const payerLabel = sp.paid_by_is_self ? t("groups.youTag") : sp.paid_by_name
              return (
                <li key={`split-${sp.id}`} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{sp.description}</span>
                      <span className="font-semibold">{formatMoney(sp.amount, sp.currency)}</span>
                      <Badge variant="outline" className="text-xs">
                        {sp.split_method === "exact" ? t("activity.methodExact") : t("activity.methodEqual")}
                      </Badge>
                      {sp.locked_by_settlement && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Lock className="size-3" />
                          {t("activity.lockedHint")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sp.spent_on)} · {t("activity.paidBy", { name: payerLabel })}
                      {sp.group_name ? ` · ${sp.group_name}` : ""}
                      {sp.my_share_minor > 0
                        ? ` · ${t("activity.yourShare", { amount: formatMoney(sp.my_share, sp.currency) })}`
                        : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                      {sp.my_linked_expense_id ? (
                        <>
                          <Link
                            href={ROUTES.expenses}
                            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                          >
                            <ExternalLink className="size-3" />
                            {t("activity.linkedExpense", { id: sp.my_linked_expense_id })}
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-1.5 text-xs text-muted-foreground"
                            disabled={unlink.isPending}
                            onClick={() => void handleUnlink(sp.id)}
                          >
                            <Unlink className="size-3" />
                            {t("activity.unlinkExpense")}
                          </Button>
                        </>
                      ) : sp.my_link_status === "recording" ? (
                        <span className="text-amber-600 dark:text-amber-400">{t("activity.recordingPending")}</span>
                      ) : (
                        sp.my_share_minor > 0 && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onLogMyShare(sp)}>
                            <ReceiptText className="size-3" />
                            {t("activity.logMyShare")}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  {sp.can_edit && (
                    <div className="flex flex-wrap items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onEditSplit(sp)}>
                        <Pencil className="size-3.5" />
                        {t("activity.edit")}
                      </Button>
                      {!sp.locked_by_settlement && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeletingSplit(sp)}
                        >
                          <Trash2 className="size-3.5" />
                          {t("activity.delete")}
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <ConfirmActionDialog
        open={deletingSplit !== null}
        title={t("activity.deleteSplitTitle", { name: deletingSplit?.description ?? "" })}
        description={t("activity.deleteSplitBody")}
        destructive
        pending={deleteSplit.isPending}
        onConfirm={() => void confirmDeleteSplit()}
        onOpenChange={(next) => !next && setDeletingSplit(null)}
      />

      <ConfirmActionDialog
        open={voiding !== null}
        title={t("activity.voidTitle")}
        description={t("activity.voidBody")}
        destructive
        pending={voidSettlement.isPending}
        onConfirm={() => void confirmVoid()}
        onOpenChange={(next) => !next && setVoiding(null)}
      />
    </Card>
  )
}
