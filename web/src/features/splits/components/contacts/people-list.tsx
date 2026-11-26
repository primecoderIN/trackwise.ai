// People & Contacts view: displays every obligation WITH its explicit context (Direct vs. each Group), never netting
// balances across separate groups (D225).

import { Archive, ArchiveRestore, HandCoins, Pencil, Plus, QrCode, Trash2, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/shared/components/empty-state"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

import type { ContextObligation, PersonBalance, SplitContact } from "../../api"
import { useDeleteContact, useUpdateContact } from "../../queries"
import { ConfirmActionDialog } from "../dialogs/confirm-action-dialog"
import type { PaymentReminderTarget } from "../dialogs/payment-qr-dialog"
import type { SettlePreset } from "../dialogs/settle-up-dialog"

/** Props for the context-preserving People & Contacts section. */
export interface PeopleListProps {
  people: readonly PersonBalance[]
  contacts: readonly SplitContact[]
  myUpiId: string | null | undefined
  onAddContact: () => void
  onEditContact: (contact: SplitContact) => void
  onOpenGroup: (groupId: number) => void
  onSettleDirect: (preset: SettlePreset) => void
  onRemindDirect: (target: PaymentReminderTarget, settlePreset?: SettlePreset) => void
}

/** Lists contacts and shared-group co-members with separate obligation lines per direct or group context. */
export function PeopleList({
  people,
  contacts,
  myUpiId,
  onAddContact,
  onEditContact,
  onOpenGroup,
  onSettleDirect,
  onRemindDirect,
}: PeopleListProps) {
  const t = useTranslations("splits")
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const [deleting, setDeleting] = useState<SplitContact | null>(null)

  const contactById = new Map(contacts.map((c) => [c.id, c]))

  async function toggleArchive(contact: SplitContact) {
    try {
      await updateContact.mutateAsync({ contactId: contact.id, body: { archived: !contact.archived_at } })
      toast.success(t("people.updated"))
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await deleteContact.mutateAsync(deleting.id)
      toast.success(t("people.deleted"))
      setDeleting(null)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  function directPreset(person: PersonBalance, ob: ContextObligation): SettlePreset {
    const contactKey = `c:${person.contact_id}`
    return {
      groupId: null,
      fromKey: ob.direction === "owed_to_you" ? contactKey : "self",
      toKey: ob.direction === "owed_to_you" ? "self" : contactKey,
      currency: ob.currency,
      amountMajor: String(ob.amount),
      outstandingMinor: ob.amount_minor,
    }
  }

  function reminderFor(person: PersonBalance, ob: ContextObligation): PaymentReminderTarget {
    const owedToYou = ob.direction === "owed_to_you"
    return {
      fromName: owedToYou ? person.display_name : t("groups.youTag"),
      toName: owedToYou ? t("groups.youTag") : person.display_name,
      toUpiId: owedToYou ? myUpiId : person.upi_id,
      amountMajor: String(ob.amount),
      currency: ob.currency,
      contextLabel: ob.context_kind === "group" && ob.group_name ? ob.group_name : t("people.directContext"),
      counterpartyName: person.display_name,
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("people.title")}</h2>
        <Button size="sm" onClick={onAddContact}>
          <Plus className="size-4" />
          {t("people.addContact")}
        </Button>
      </div>

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("people.emptyTitle")}
          message={t("people.emptyDescription")}
          action={{ label: t("people.addContact"), onClick: onAddContact }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {people.map((person) => {
            const contact = person.contact_id ? contactById.get(person.contact_id) : undefined
            return (
              <Card key={person.key}>
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{person.display_name}</span>
                      {person.upi_id && <Badge variant="outline">{t("people.upiBadge")}</Badge>}
                      {!person.is_contact && <Badge variant="secondary">{t("people.sharedOnlyBadge")}</Badge>}
                      {person.archived && <Badge variant="outline">{t("people.archivedBadge")}</Badge>}
                    </div>
                    {contact && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => onEditContact(contact)}>
                          <Pencil className="size-3.5" />
                          {t("people.edit")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void toggleArchive(contact)}>
                          {contact.archived_at ? (
                            <ArchiveRestore className="size-3.5" />
                          ) : (
                            <Archive className="size-3.5" />
                          )}
                          {contact.archived_at ? t("people.unarchive") : t("people.archive")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleting(contact)}
                        >
                          <Trash2 className="size-3.5" />
                          {t("people.delete")}
                        </Button>
                      </div>
                    )}
                  </div>

                  {person.obligations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("people.settled")}</p>
                  ) : (
                    <ul className="divide-y rounded-md border">
                      {person.obligations.map((ob, idx) => (
                        <li
                          key={`${ob.context_kind}-${ob.group_id ?? "direct"}-${ob.currency}-${idx}`}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {ob.context_kind === "group" && ob.group_id ? (
                              <button
                                type="button"
                                className="font-medium underline-offset-4 hover:underline"
                                onClick={() => onOpenGroup(ob.group_id!)}
                              >
                                {ob.group_name}
                              </button>
                            ) : (
                              <span className="font-medium text-muted-foreground">{t("people.directContext")}</span>
                            )}
                            <span
                              className={
                                ob.direction === "owed_to_you"
                                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                                  : "font-semibold text-amber-600 dark:text-amber-400"
                              }
                            >
                              {ob.direction === "owed_to_you"
                                ? t("people.owesYou", { amount: formatMoney(ob.amount, ob.currency) })
                                : t("people.youOwe", { amount: formatMoney(ob.amount, ob.currency) })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                onRemindDirect(
                                  reminderFor(person, ob),
                                  ob.context_kind === "direct" && person.contact_id
                                    ? directPreset(person, ob)
                                    : undefined,
                                )
                              }
                            >
                              <QrCode className="size-3.5" />
                              {t("people.remindOrPay")}
                            </Button>
                            {ob.context_kind === "direct" && person.contact_id ? (
                              <Button size="sm" onClick={() => onSettleDirect(directPreset(person, ob))}>
                                <HandCoins className="size-3.5" />
                                {t("page.settleUp")}
                              </Button>
                            ) : (
                              ob.group_id && (
                                <Button size="sm" variant="secondary" onClick={() => onOpenGroup(ob.group_id!)}>
                                  {t("join.openGroup")}
                                </Button>
                              )
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ConfirmActionDialog
        open={deleting !== null}
        title={t("people.deleteConfirmTitle", { name: deleting?.name ?? "" })}
        description={t("people.deleteConfirmBody")}
        destructive
        pending={deleteContact.isPending}
        onConfirm={() => void confirmDelete()}
        onOpenChange={(next) => !next && setDeleting(null)}
      />
    </div>
  )
}
