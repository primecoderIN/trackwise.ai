// Dialog for creating or editing a Personal or Shared group, including inline quick-add contact and guest inputs.

import { Plus, UserPlus, Users, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { SPLITS } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { LabeledField } from "@/shared/components/labeled-field"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import type { GroupDetail, SplitContact } from "../../api"
import { useCreateContact, useCreateGroup, useUpdateGroup } from "../../queries"

/** Props for the Group create/edit dialog. */
export interface GroupDialogProps {
  open: boolean
  contacts: readonly SplitContact[]
  editing: GroupDetail | null
  onOpenChange: (open: boolean) => void
  onCreated?: (groupId: number) => void
}

/** Creates a Personal or Shared group (with inline quick-add contacts & guests) or edits an existing group. */
export function GroupDialog({ open, contacts, editing, onOpenChange, onCreated }: GroupDialogProps) {
  const t = useTranslations("splits")
  const messageOf = useMessageOf()
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()
  const createContact = useCreateContact()

  const [name, setName] = useState(editing?.group.name ?? "")
  const [kind, setKind] = useState<"personal" | "shared">(editing?.group.kind ?? "personal")
  const [currency, setCurrency] = useState(editing?.group.default_currency ?? "")
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([])
  const [quickName, setQuickName] = useState("")
  const [guestDraft, setGuestDraft] = useState("")
  const [guestNames, setGuestNames] = useState<string[]>([])

  const saving = createGroup.isPending || updateGroup.isPending
  const activeContacts = contacts.filter((c) => !c.archived_at)

  function reset(nextOpen: boolean) {
    if (nextOpen) {
      setName(editing?.group.name ?? "")
      setKind(editing?.group.kind ?? "personal")
      setCurrency(editing?.group.default_currency ?? "")
      setSelectedContactIds([])
      setQuickName("")
      setGuestDraft("")
      setGuestNames([])
    }
    onOpenChange(nextOpen)
  }

  function toggleContact(id: number) {
    setSelectedContactIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  async function handleQuickAddContact() {
    const trimmed = quickName.trim()
    if (!trimmed) return
    try {
      const created = await createContact.mutateAsync({ name: trimmed })
      setSelectedContactIds((prev) => [...prev, created.id])
      setQuickName("")
      toast.success(t("people.created"))
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  function addGuest() {
    const trimmed = guestDraft.trim()
    if (!trimmed) return
    setGuestNames((prev) => [...prev, trimmed])
    setGuestDraft("")
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    try {
      if (editing) {
        await updateGroup.mutateAsync({
          groupId: editing.group.id,
          body: {
            name: trimmedName,
            default_currency: currency || null,
            add_contact_ids: selectedContactIds,
            add_guest_names: guestNames,
          },
        })
        toast.success(t("groups.updated"))
      } else {
        const created = await createGroup.mutateAsync({
          name: trimmedName,
          kind,
          default_currency: currency || null,
          member_contact_ids: selectedContactIds,
          guest_names: guestNames,
        })
        toast.success(t("groups.created"))
        onCreated?.(created.group.id)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("dialogs.group.editTitle") : t("dialogs.group.addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogs.group.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <LabeledField id="group-name" label={t("dialogs.group.nameLabel")}>
            <Input
              id="group-name"
              required
              maxLength={SPLITS.limits.nameLength}
              placeholder={t("dialogs.group.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </LabeledField>

          {!editing && (
            <div className="flex flex-col gap-2">
              <Label>{t("dialogs.group.kindLabel")}</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(["personal", "shared"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={kind === option}
                    onClick={() => setKind(option)}
                    className={`flex flex-col items-start gap-1 rounded-md border p-3 text-left text-sm transition-colors ${
                      kind === option ? "border-primary bg-primary/5" : "hover:bg-accent/40"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      {option === "personal" ? <UserPlus className="size-4" /> : <Users className="size-4" />}
                      {option === "personal" ? t("dialogs.group.personalTitle") : t("dialogs.group.sharedTitle")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {option === "personal" ? t("dialogs.group.personalHint") : t("dialogs.group.sharedHint")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <LabeledField id="group-currency" label={t("dialogs.group.currencyLabel")}>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <CurrencySelect id="group-currency" value={currency} onChange={(next) => setCurrency(next)} />
              </div>
              {currency && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setCurrency("")}>
                  <X className="size-4" />
                </Button>
              )}
            </div>
          </LabeledField>

          <div className="flex flex-col gap-2">
            <Label>{t("dialogs.group.contactsLabel")}</Label>
            {activeContacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("dialogs.group.noContactsYet")}</p>
            ) : (
              <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border p-2.5 sm:grid-cols-2">
                {activeContacts.map((contact) => (
                  <label key={contact.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedContactIds.includes(contact.id)}
                      onCheckedChange={() => toggleContact(contact.id)}
                    />
                    <span className="truncate">{contact.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                aria-label={t("dialogs.group.quickAddLabel")}
                placeholder={t("dialogs.group.quickAddPlaceholder")}
                maxLength={SPLITS.limits.nameLength}
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={createContact.isPending || !quickName.trim()}
                onClick={() => void handleQuickAddContact()}
              >
                <Plus className="size-4" />
                {t("dialogs.group.quickAddButton")}
              </Button>
            </div>
          </div>

          {kind === "shared" && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="group-guest-input">{t("dialogs.group.guestsLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="group-guest-input"
                  placeholder={t("dialogs.group.guestPlaceholder")}
                  maxLength={SPLITS.limits.nameLength}
                  value={guestDraft}
                  onChange={(e) => setGuestDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addGuest()
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={!guestDraft.trim()} onClick={addGuest}>
                  <Plus className="size-4" />
                  {t("dialogs.group.quickAddButton")}
                </Button>
              </div>
              {guestNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {guestNames.map((guest, index) => (
                    <Badge key={`${guest}-${index}`} variant="secondary" className="gap-1">
                      {guest}
                      <button
                        type="button"
                        aria-label={t("dialogs.group.removeMember")}
                        onClick={() => setGuestNames((prev) => prev.filter((_, idx) => idx !== index))}
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("dialogs.cancel")}
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? t("dialogs.saving") : t("dialogs.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
