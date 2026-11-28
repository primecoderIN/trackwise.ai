// "Are you sure?" before something that ends access: revoking a token, signing every other browser out. Part of the
// account feature (components/). Used by the token row and the sessions card.

import { Button, Dialog } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"

interface ConfirmDialogProps {
  open: boolean
  /** Closes the dialog (Cancel, Escape, or after confirming). */
  onClose: () => void
  /** The question ("Revoke this token?"). */
  title: string
  /** What will happen if they go ahead. */
  description: string
  /** The confirming button's text ("Revoke"). */
  confirmLabel: string
  /** They confirmed: do it. The dialog closes by itself. */
  onConfirm: () => void
}

/** The question, with Cancel and a destructive confirm button. */
export function ConfirmDialog({ open, onClose, title, description, confirmLabel, onConfirm }: ConfirmDialogProps) {
  const t = useTranslations("account")
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      modalType="alert"
      size="narrow"
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-secondary">{description}</p>
    </Dialog>
  )
}
