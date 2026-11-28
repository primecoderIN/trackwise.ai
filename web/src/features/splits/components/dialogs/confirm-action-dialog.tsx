// Reusable accessible confirmation Dialog for destructive or irreversible Splits actions.

import { Button, Dialog } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"

/** Props for the Splits confirmation dialog. */
export interface ConfirmActionDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}

/** Accessible alert Dialog confirming delete, void, leave, or upgrade actions. */
export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  pending = false,
  onConfirm,
  onOpenChange,
}: ConfirmActionDialogProps) {
  const t = useTranslations("splits")

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      modalType="alert"
      size="narrow"
      title={title}
      actions={
        <>
          <Button variant="secondary" disabled={pending} onClick={() => onOpenChange(false)}>
            {t("dialogs.cancel")}
          </Button>
          <Button variant={destructive ? "destructive" : "primary"} isLoading={pending} onClick={onConfirm}>
            {pending ? t("dialogs.saving") : (confirmLabel ?? t("dialogs.confirm"))}
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-secondary">{description}</p>
    </Dialog>
  )
}
