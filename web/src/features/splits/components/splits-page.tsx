// Main Splits page (/splits): top non-netted per-currency summary strip, Groups / People / Activity tabs,
// single-group detail drilldown, and all Splits dialogs (D226).

import { HandCoins, Plus, QrCode, ReceiptText, UserRound, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { useSignedInUser } from "@/features/auth"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Skeleton } from "@/shared/ui/skeleton"

import type { GroupMember, SplitContact, SplitExpense } from "../api"
import { useSplitExpenses, useSplitSettlements, useSplitsOverview } from "../queries"
import { ActivityList } from "./activity/activity-list"
import { PeopleList } from "./contacts/people-list"
import { ContactDialog } from "./dialogs/contact-dialog"
import { GroupDialog } from "./dialogs/group-dialog"
import { LogMyShareDialog } from "./dialogs/log-my-share-dialog"
import { PaymentQrDialog, type PaymentReminderTarget } from "./dialogs/payment-qr-dialog"
import { type SettlePreset, SettleUpDialog } from "./dialogs/settle-up-dialog"
import { SplitDialog } from "./dialogs/split-dialog"
import { MyUpiDialog } from "./dialogs/my-upi-dialog"
import { GroupDetailView } from "./groups/group-detail"
import { GroupsList } from "./groups/groups-list"
import { BalanceStrip } from "./summary/balance-strip"

type SplitsTab = "groups" | "people" | "activity"

interface SplitDialogState {
  key: number
  groupId: number | null
  groupName?: string | null
  groupMembers?: readonly GroupMember[]
  defaultCurrency?: string
  editing: SplitExpense | null
}

function initialGroupFromUrl(): number | null {
  if (typeof window === "undefined") return null
  const param = new URLSearchParams(window.location.search).get("group")
  const parsed = param ? Number(param) : Number.NaN
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

/** Signed-in Splits workspace page supporting Personal & Shared groups, People obligations, and Activity. */
export function SplitsPage() {
  const t = useTranslations("splits")
  const messageOf = useMessageOf()
  const signedIn = useSignedInUser()
  const [tab, setTab] = useState<SplitsTab>("groups")
  const [includeArchived, setIncludeArchived] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialGroupFromUrl)

  const [myUpiOpen, setMyUpiOpen] = useState(false)
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [contactDialog, setContactDialog] = useState<{ open: boolean; editing: SplitContact | null }>({
    open: false,
    editing: null,
  })
  const [splitDialog, setSplitDialog] = useState<SplitDialogState | null>(null)
  const [settleDialog, setSettleDialog] = useState<{ key: number; preset: SettlePreset | null } | null>(null)
  const [reminderDialog, setReminderDialog] = useState<{
    target: PaymentReminderTarget
    settlePreset?: SettlePreset
  } | null>(null)
  const [loggingShare, setLoggingShare] = useState<SplitExpense | null>(null)

  const overview = useSplitsOverview(includeArchived)
  const splitsFeed = useSplitExpenses()
  const settlementsFeed = useSplitSettlements()
  const defaultCurrency = signedIn.data?.default_currency

  function openNewSplit(
    groupId: number | null = null,
    groupName?: string | null,
    groupMembers?: readonly GroupMember[],
    currency?: string,
  ) {
    setSplitDialog({
      key: Date.now(),
      groupId,
      groupName,
      groupMembers,
      defaultCurrency: currency ?? defaultCurrency,
      editing: null,
    })
  }

  function openEditSplit(split: SplitExpense, groupMembers?: readonly GroupMember[]) {
    setSplitDialog({
      key: Date.now(),
      groupId: split.group_id,
      groupName: split.group_name,
      groupMembers,
      defaultCurrency: split.currency,
      editing: split,
    })
  }

  function openSettle(preset: SettlePreset | null = null) {
    setSettleDialog({ key: Date.now(), preset })
  }

  const tabs: { id: SplitsTab; icon: typeof Users }[] = [
    { id: "groups", icon: Users },
    { id: "people", icon: UserRound },
    { id: "activity", icon: ReceiptText },
  ]

  return (
    <div className="flex max-w-6xl flex-col gap-4">
      <PageHeader
        title={t("page.title")}
        description={t("page.description")}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setMyUpiOpen(true)}>
              <QrCode className="size-4" />
              {t("page.myUpi")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => openSettle(null)}>
              <HandCoins className="size-4" />
              {t("page.settleUp")}
            </Button>
            <Button size="sm" onClick={() => openNewSplit(null)}>
              <Plus className="size-4" />
              {t("page.addSplit")}
            </Button>
          </>
        }
      />

      {overview.data ? (
        <>
          {overview.isError && (
            <RefreshNotice
              message={messageOf(overview.error)}
              onRetry={() => void overview.refetch()}
              retrying={overview.isFetching}
            />
          )}

          <BalanceStrip totals={overview.data.totals} />

          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label={t("page.tabsLabel")}>
              {tabs.map(({ id, icon: Icon }) => (
                <Button
                  key={id}
                  role="tab"
                  id={`splits-tab-${id}`}
                  aria-selected={tab === id}
                  aria-controls={`splits-panel-${id}`}
                  variant={tab === id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setTab(id)
                    if (id !== "groups") setSelectedGroupId(null)
                  }}
                >
                  <Icon className="size-4" />
                  {t(`tabs.${id}`)}
                </Button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox checked={includeArchived} onCheckedChange={(c) => setIncludeArchived(c === true)} />
              <span>{t("page.showArchived")}</span>
            </label>
          </div>

          <div role="tabpanel" id={`splits-panel-${tab}`} aria-labelledby={`splits-tab-${tab}`}>
            {tab === "groups" &&
              (selectedGroupId !== null ? (
                <GroupDetailView
                  groupId={selectedGroupId}
                  contacts={overview.data.contacts}
                  onBack={() => setSelectedGroupId(null)}
                  onAddSplit={(gid, gname, members, cur) => openNewSplit(gid, gname, members, cur)}
                  onEditSplit={(sp, members) => openEditSplit(sp, members)}
                  onLogMyShare={setLoggingShare}
                  onSettlePreset={(preset) => openSettle(preset)}
                  onRemindTarget={(target, preset) => setReminderDialog({ target, settlePreset: preset })}
                />
              ) : (
                <GroupsList
                  groups={overview.data.groups}
                  onSelectGroup={setSelectedGroupId}
                  onNewGroup={() => setNewGroupOpen(true)}
                />
              ))}

            {tab === "people" && (
              <PeopleList
                people={overview.data.people}
                contacts={overview.data.contacts}
                myUpiId={overview.data.profile.upi_id}
                onAddContact={() => setContactDialog({ open: true, editing: null })}
                onEditContact={(c) => setContactDialog({ open: true, editing: c })}
                onOpenGroup={(gid) => {
                  setTab("groups")
                  setSelectedGroupId(gid)
                }}
                onSettleDirect={(preset) => openSettle(preset)}
                onRemindDirect={(target, settlePreset) => setReminderDialog({ target, settlePreset })}
              />
            )}

            {tab === "activity" && (
              <ActivityList
                splits={splitsFeed.data?.items ?? []}
                settlements={settlementsFeed.data?.items ?? []}
                onEditSplit={(sp) => openEditSplit(sp)}
                onLogMyShare={setLoggingShare}
              />
            )}
          </div>

          <MyUpiDialog
            key={`upi-${myUpiOpen ? "open" : "closed"}-${overview.data.profile.upi_id ?? ""}`}
            open={myUpiOpen}
            profile={overview.data.profile}
            onOpenChange={setMyUpiOpen}
          />
          <GroupDialog
            open={newGroupOpen}
            contacts={overview.data.contacts}
            editing={null}
            onOpenChange={setNewGroupOpen}
            onCreated={(gid) => {
              setTab("groups")
              setSelectedGroupId(gid)
            }}
          />
          <ContactDialog
            key={`contact-${contactDialog.open}-${contactDialog.editing?.id ?? "new"}`}
            open={contactDialog.open}
            editing={contactDialog.editing}
            onOpenChange={(open) => setContactDialog((prev) => ({ ...prev, open }))}
          />
          {splitDialog && (
            <SplitDialog
              key={splitDialog.key}
              open={true}
              contacts={overview.data.contacts}
              groupId={splitDialog.groupId}
              groupName={splitDialog.groupName}
              groupMembers={splitDialog.groupMembers}
              defaultCurrency={splitDialog.defaultCurrency}
              editing={splitDialog.editing}
              onOpenChange={(open) => !open && setSplitDialog(null)}
            />
          )}
          {settleDialog && (
            <SettleUpDialog
              key={settleDialog.key}
              open={true}
              contacts={overview.data.contacts}
              defaultCurrency={defaultCurrency}
              preset={settleDialog.preset}
              onOpenChange={(open) => !open && setSettleDialog(null)}
            />
          )}
          <PaymentQrDialog
            target={reminderDialog?.target ?? null}
            onClose={() => setReminderDialog(null)}
            onRecordSettlement={
              reminderDialog?.settlePreset ? () => openSettle(reminderDialog.settlePreset ?? null) : undefined
            }
          />
          <LogMyShareDialog split={loggingShare} onClose={() => setLoggingShare(null)} />
        </>
      ) : overview.isError ? (
        <SectionError
          title={t("page.loadFailed")}
          message={messageOf(overview.error)}
          onRetry={() => void overview.refetch()}
          retrying={overview.isFetching}
        />
      ) : (
        <div className="grid gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      )}
    </div>
  )
}
