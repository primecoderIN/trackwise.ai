// Dialog for creating or editing a private split contact (name, optional INR UPI ID, optional note).

import { Button, Dialog, TextField } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"

import { SPLITS } from "@/shared/api/contracts.gen"
import { toast } from "@/shared/lib/toast"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { SplitContact } from "../../api"
import { useCreateContact, useUpdateContact } from "../../queries"
import { isValidUpiId } from "../../upi"

const FORM_ID = "split-contact-form"

/** Props for the Contact create/edit dialog. */
export interface ContactDialogProps {
  open: boolean
  editing: SplitContact | null
  onOpenChange: (open: boolean) => void
}

/** Modal form to create or edit one private contact owned by the signed-in user. */
export function ContactDialog({ open, editing, onOpenChange }: ContactDialogProps) {
  const t = useTranslations("splits")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const create = useCreateContact()
  const update = useUpdateContact()
  const [name, setName] = useState(editing?.name ?? "")
  const [upiId, setUpiId] = useState(editing?.upi_id ?? "")
  const [note, setNote] = useState(editing?.note ?? "")
  const [upiError, setUpiError] = useState<string | null>(null)

  const saving = create.isPending || update.isPending

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(editing?.name ?? "")
      setUpiId(editing?.upi_id ?? "")
      setNote(editing?.note ?? "")
      setUpiError(null)
    }
    onOpenChange(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedUpi = upiId.trim()
    const trimmedNote = note.trim()
    if (!trimmedName) return
    if (trimmedUpi && !isValidUpiId(trimmedUpi)) {
      setUpiError(t("dialogs.contact.upiPlaceholder"))
      return
    }
    setUpiError(null)
    try {
      if (editing) {
        await update.mutateAsync({
          contactId: editing.id,
          body: { name: trimmedName, upi_id: trimmedUpi || null, note: trimmedNote || null },
        })
        toast.success(t("people.updated"))
      } else {
        await create.mutateAsync({ name: trimmedName, upi_id: trimmedUpi || null, note: trimmedNote || null })
        toast.success(t("people.created"))
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size="narrow"
      title={editing ? t("dialogs.contact.editTitle") : t("dialogs.contact.addTitle")}
      description={t("dialogs.contact.description")}
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
          label={t("dialogs.contact.nameLabel")}
          required
          maxLength={SPLITS.limits.nameLength}
          placeholder={t("dialogs.contact.namePlaceholder")}
          value={name}
          onValueChange={setName}
          size="small"
        />
        <TextField
          label={t("dialogs.contact.upiLabel")}
          maxLength={SPLITS.limits.upiIdLength}
          placeholder={t("dialogs.contact.upiPlaceholder")}
          hint={t("dialogs.contact.upiHint")}
          errorMessage={upiError ?? undefined}
          value={upiId}
          onValueChange={(next) => {
            setUpiId(next)
            setUpiError(null)
          }}
          size="small"
        />
        <TextField
          label={t("dialogs.contact.noteLabel")}
          maxLength={SPLITS.limits.contactNoteLength}
          placeholder={t("dialogs.contact.notePlaceholder")}
          value={note}
          onValueChange={setNote}
          size="small"
        />
      </form>
    </Dialog>
  )
}
