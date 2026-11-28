// Dialog for editing the signed-in user's own optional INR UPI ID and opt-in shared-group visibility (D225).

import { Button, CheckboxField, Dialog, TextField } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"

import { SPLITS } from "@/shared/api/contracts.gen"
import { toast } from "@/shared/lib/toast"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { SplitProfile } from "../../api"
import { useUpdateSplitProfile } from "../../queries"
import { isValidUpiId } from "../../upi"

const FORM_ID = "my-upi-form"

/** Props for the user's own UPI receive-profile dialog. */
export interface MyUpiDialogProps {
  open: boolean
  profile: SplitProfile
  onOpenChange: (open: boolean) => void
}

/** Lets the signed-in user configure their optional INR UPI ID and toggle sharing with Shared groups. */
export function MyUpiDialog({ open, profile, onOpenChange }: MyUpiDialogProps) {
  const t = useTranslations("splits")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const update = useUpdateSplitProfile()
  const [upiId, setUpiId] = useState(profile.upi_id ?? "")
  const [share, setShare] = useState(Boolean(profile.share_upi_with_groups))
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (next) {
      setUpiId(profile.upi_id ?? "")
      setShare(Boolean(profile.share_upi_with_groups))
      setError(null)
    }
    onOpenChange(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = upiId.trim()
    if (trimmed && !isValidUpiId(trimmed)) {
      setError(t("dialogs.contact.upiPlaceholder"))
      return
    }
    setError(null)
    try {
      await update.mutateAsync({ upi_id: trimmed || null, share_upi_with_groups: trimmed ? share : false })
      toast.success(t("dialogs.myUpi.saved"))
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
      title={t("dialogs.myUpi.title")}
      description={t("dialogs.myUpi.description")}
      closeLabel={tCommon("ui.close")}
      actions={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("dialogs.cancel")}
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} isLoading={update.isPending}>
            {update.isPending ? t("dialogs.saving") : t("dialogs.save")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <TextField
          label={t("dialogs.myUpi.upiLabel")}
          value={upiId}
          maxLength={SPLITS.limits.upiIdLength}
          placeholder={t("dialogs.myUpi.upiPlaceholder")}
          hint={t("dialogs.contact.upiHint")}
          errorMessage={error ?? undefined}
          onValueChange={(next) => {
            setUpiId(next)
            setError(null)
          }}
          size="small"
        />

        <div className="rounded-md border border-line p-3">
          <CheckboxField
            label={t("dialogs.myUpi.shareLabel")}
            hint={t("dialogs.myUpi.shareHint")}
            checked={share}
            onCheckedChange={setShare}
            disabled={!upiId.trim()}
          />
        </div>
      </form>
    </Dialog>
  )
}
