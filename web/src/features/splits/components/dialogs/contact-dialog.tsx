// Dialog for creating or editing a private split contact (name, optional INR UPI ID, optional note).

import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { SPLITS } from "@/shared/api/contracts.gen"
import { LabeledField } from "@/shared/components/labeled-field"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"

import type { SplitContact } from "../../api"
import { useCreateContact, useUpdateContact } from "../../queries"
import { isValidUpiId } from "../../upi"

/** Props for the Contact create/edit dialog. */
export interface ContactDialogProps {
  open: boolean
  editing: SplitContact | null
  onOpenChange: (open: boolean) => void
}

/** Modal form to create or edit one private contact owned by the signed-in user. */
export function ContactDialog({ open, editing, onOpenChange }: ContactDialogProps) {
  const t = useTranslations("splits")
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? t("dialogs.contact.editTitle") : t("dialogs.contact.addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogs.contact.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <LabeledField id="contact-name" label={t("dialogs.contact.nameLabel")}>
            <Input
              id="contact-name"
              required
              maxLength={SPLITS.limits.nameLength}
              placeholder={t("dialogs.contact.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </LabeledField>
          <LabeledField id="contact-upi" label={t("dialogs.contact.upiLabel")}>
            <Input
              id="contact-upi"
              maxLength={SPLITS.limits.upiIdLength}
              placeholder={t("dialogs.contact.upiPlaceholder")}
              value={upiId}
              onChange={(e) => {
                setUpiId(e.target.value)
                setUpiError(null)
              }}
            />
            <p className="text-xs text-muted-foreground">{t("dialogs.contact.upiHint")}</p>
            {upiError && <p className="text-xs text-destructive">{upiError}</p>}
          </LabeledField>
          <LabeledField id="contact-note" label={t("dialogs.contact.noteLabel")}>
            <Input
              id="contact-note"
              maxLength={SPLITS.limits.contactNoteLength}
              placeholder={t("dialogs.contact.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </LabeledField>
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
