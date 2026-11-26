// Dialog for editing the signed-in user's own optional INR UPI ID and opt-in shared-group visibility (D225).

import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { SPLITS } from "@/shared/api/contracts.gen"
import { LabeledField } from "@/shared/components/labeled-field"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import type { SplitProfile } from "../../api"
import { useUpdateSplitProfile } from "../../queries"
import { isValidUpiId } from "../../upi"

/** Props for the user's own UPI receive-profile dialog. */
export interface MyUpiDialogProps {
  open: boolean
  profile: SplitProfile
  onOpenChange: (open: boolean) => void
}

/** Lets the signed-in user configure their optional INR UPI ID and toggle sharing with Shared groups. */
export function MyUpiDialog({ open, profile, onOpenChange }: MyUpiDialogProps) {
  const t = useTranslations("splits")
  const messageOf = useMessageOf()
  const update = useUpdateSplitProfile()
  const [upiId, setUpiId] = useState(profile.upi_id ?? "")
  const [share, setShare] = useState(profile.share_upi_with_groups)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (next) {
      setUpiId(profile.upi_id ?? "")
      setShare(profile.share_upi_with_groups)
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.myUpi.title")}</DialogTitle>
          <DialogDescription>{t("dialogs.myUpi.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <LabeledField id="my-upi-id" label={t("dialogs.myUpi.upiLabel")}>
            <Input
              id="my-upi-id"
              value={upiId}
              maxLength={SPLITS.limits.upiIdLength}
              placeholder={t("dialogs.myUpi.upiPlaceholder")}
              onChange={(e) => {
                setUpiId(e.target.value)
                setError(null)
              }}
            />
            <p className="text-xs text-muted-foreground">{t("dialogs.contact.upiHint")}</p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </LabeledField>

          <div className="flex items-start gap-2.5 rounded-md border p-3">
            <Checkbox
              id="share-upi-groups"
              checked={share}
              onCheckedChange={(checked) => setShare(checked === true)}
              disabled={!upiId.trim()}
            />
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="share-upi-groups" className="cursor-pointer text-sm">
                {t("dialogs.myUpi.shareLabel")}
              </Label>
              <p className="text-xs text-muted-foreground">{t("dialogs.myUpi.shareHint")}</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("dialogs.cancel")}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? t("dialogs.saving") : t("dialogs.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
