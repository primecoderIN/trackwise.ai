// Dialog for creating or editing a Personal or Shared group, including inline quick-add contact and guest inputs.

import { Button, CheckboxBox, Dialog, Tag, TextField } from "@primecoderin/fast-ui-react"
import { Plus, UserPlus, Users, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"

import { SPLITS } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { LabeledField } from "@/shared/components/labeled-field"
import { toast } from "@/shared/lib/toast"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { GroupDetail, SplitContact } from "../../api"
import { useCreateContact, useCreateGroup, useUpdateGroup } from "../../queries"

const FORM_ID = "split-group-form"

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
  const tCommon = useTranslations("common")
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
    <Dialog
      open={open}
      onOpenChange={reset}
      size="narrow"
      title={editing ? t("dialogs.group.editTitle") : t("dialogs.group.addTitle")}
      description={t("dialogs.group.description")}
      closeLabel={tCommon("ui.close")}
      actions={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("dialogs.cancel")}
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} disabled={!name.trim()} isLoading={saving}>
            {saving ? t("dialogs.saving") : t("dialogs.save")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <TextField
          label={t("dialogs.group.nameLabel")}
          required
          maxLength={SPLITS.limits.nameLength}
          placeholder={t("dialogs.group.namePlaceholder")}
          value={name}
          onValueChange={setName}
          size="small"
        />

        {!editing && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-fg">{t("dialogs.group.kindLabel")}</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["personal", "shared"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={kind === option}
                  onClick={() => setKind(option)}
                  className={`flex flex-col items-start gap-1 rounded-md border p-3 text-start text-sm transition-colors ${
                    kind === option ? "border-primary-active bg-primary-light" : "border-line hover:bg-subtle"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium text-fg">
                    {option === "personal" ? <UserPlus className="size-4" /> : <Users className="size-4" />}
                    {option === "personal" ? t("dialogs.group.personalTitle") : t("dialogs.group.sharedTitle")}
                  </span>
                  <span className="text-xs text-fg-secondary">
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
              <Button
                variant="icon"
                size="small"
                icon={<X />}
                aria-label={tCommon("datePicker.clear")}
                onClick={() => setCurrency("")}
              />
            )}
          </div>
        </LabeledField>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-fg">{t("dialogs.group.contactsLabel")}</span>
          {activeContacts.length === 0 ? (
            <p className="text-xs text-fg-secondary">{t("dialogs.group.noContactsYet")}</p>
          ) : (
            <div className="grid max-h-36 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-line p-2.5 sm:grid-cols-2">
              {activeContacts.map((contact) => (
                <label key={contact.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <CheckboxBox
                    checked={selectedContactIds.includes(contact.id)}
                    onCheckedChange={() => toggleContact(contact.id)}
                  />
                  <span className="truncate">{contact.name}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label={t("dialogs.group.quickAddLabel")}
                hideLabel
                placeholder={t("dialogs.group.quickAddPlaceholder")}
                maxLength={SPLITS.limits.nameLength}
                value={quickName}
                onValueChange={setQuickName}
                size="small"
              />
            </div>
            <Button
              variant="secondary"
              size="small"
              icon={<Plus />}
              disabled={!quickName.trim()}
              isLoading={createContact.isPending}
              onClick={() => void handleQuickAddContact()}
            >
              {t("dialogs.group.quickAddButton")}
            </Button>
          </div>
        </div>

        {kind === "shared" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextField
                  label={t("dialogs.group.guestsLabel")}
                  placeholder={t("dialogs.group.guestPlaceholder")}
                  maxLength={SPLITS.limits.nameLength}
                  value={guestDraft}
                  onValueChange={setGuestDraft}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addGuest()
                    }
                  }}
                  size="small"
                />
              </div>
              <Button variant="secondary" size="small" icon={<Plus />} disabled={!guestDraft.trim()} onClick={addGuest}>
                {t("dialogs.group.quickAddButton")}
              </Button>
            </div>
            {guestNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {guestNames.map((guest, index) => (
                  <Tag key={`${guest}-${index}`} className="gap-1">
                    {guest}
                    <button
                      type="button"
                      aria-label={t("dialogs.group.removeMember")}
                      onClick={() => setGuestNames((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      <X className="size-3" />
                    </button>
                  </Tag>
                ))}
              </div>
            )}
          </div>
        )}
      </form>
    </Dialog>
  )
}
