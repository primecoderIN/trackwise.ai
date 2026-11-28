// Settlement reminder & optional INR UPI QR dialog (D225).
// Always encodes the actual outstanding settlement amount, never assumes payment completion, and works globally via
// one-click Copy Reminder for all currencies.

import { Button, Dialog } from "@primecoderin/fast-ui-react"
import { Check, Copy, ExternalLink, QrCode } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { linkButtonClass } from "@/shared/components/link-button"
import { toast } from "@/shared/lib/toast"
import { useFormatters } from "@/shared/lib/use-formatters"

import { buildUpiPayUri } from "../../upi"
import { UpiQrSvg } from "./upi-qr-svg"

/** Context describing one obligation to remind or pay via UPI QR. */
export interface PaymentReminderTarget {
  fromName: string
  toName: string
  toUpiId: string | null | undefined
  amountMajor: string
  currency: string
  contextLabel: string
  counterpartyName: string
}

/** Props for the payment reminder & UPI QR dialog. */
export interface PaymentQrDialogProps {
  target: PaymentReminderTarget | null
  onClose: () => void
  onRecordSettlement?: () => void
}

/** Displays a copyable reminder for any currency plus a scannable INR UPI QR & deep link when a valid VPA exists. */
export function PaymentQrDialog({ target, onClose, onRecordSettlement }: PaymentQrDialogProps) {
  const t = useTranslations("splits")
  const tCommon = useTranslations("common")
  const { formatMoney } = useFormatters()
  const [copiedReminder, setCopiedReminder] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)

  if (!target) return null

  const formattedAmount = formatMoney(target.amountMajor, target.currency)
  const upiUri = buildUpiPayUri({
    upiId: target.toUpiId,
    payeeName: target.toName,
    amountMajor: target.amountMajor,
    currency: target.currency,
    note: target.contextLabel,
  })
  const reminderText =
    upiUri && target.toUpiId
      ? t("dialogs.paymentQr.reminderWithUpi", {
          person: target.counterpartyName,
          amount: formattedAmount,
          context: target.contextLabel,
          upi: target.toUpiId,
        })
      : t("dialogs.paymentQr.reminderTemplate", {
          person: target.counterpartyName,
          amount: formattedAmount,
          context: target.contextLabel,
        })

  async function copyText(text: string, kind: "reminder" | "upi") {
    try {
      await navigator.clipboard.writeText(text)
      if (kind === "reminder") {
        setCopiedReminder(true)
        toast.success(t("dialogs.paymentQr.reminderCopied"))
        setTimeout(() => setCopiedReminder(false), 1800)
      } else {
        setCopiedUpi(true)
        toast.success(t("dialogs.paymentQr.upiCopied"))
        setTimeout(() => setCopiedUpi(false), 1800)
      }
    } catch {
      toast.error(text)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      size="narrow"
      icon={<QrCode />}
      title={t("dialogs.paymentQr.title")}
      description={t("dialogs.paymentQr.description")}
      closeLabel={tCommon("ui.close")}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("dialogs.close")}
          </Button>
          {onRecordSettlement && (
            <Button
              variant="primary"
              onClick={() => {
                onClose()
                onRecordSettlement()
              }}
            >
              {t("dialogs.paymentQr.recordNow")}
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-md border border-line bg-subtle p-3 text-sm">
          <p className="font-medium text-fg">
            {t("dialogs.paymentQr.summaryLine", {
              from: target.fromName,
              to: target.toName,
              amount: formattedAmount,
            })}
          </p>
          <p className="text-xs text-fg-secondary">
            {t("dialogs.paymentQr.contextLine", { context: target.contextLabel })}
          </p>
        </div>

        {upiUri && target.toUpiId ? (
          <div className="flex flex-col items-center gap-3 rounded-md border border-line p-4">
            <UpiQrSvg
              uri={upiUri}
              label={t("dialogs.paymentQr.qrLabel", { name: target.toName, amount: formattedAmount })}
            />
            <p className="font-mono text-xs text-fg-secondary">{target.toUpiId}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <a className={linkButtonClass({ variant: "primary", size: "small" })} href={upiUri}>
                <ExternalLink className="size-3.5" aria-hidden="true" />
                {t("dialogs.paymentQr.openUpiApp")}
              </a>
              <Button
                size="small"
                variant="secondary"
                icon={copiedUpi ? <Check /> : <Copy />}
                onClick={() => void copyText(target.toUpiId!, "upi")}
              >
                {t("dialogs.paymentQr.copyUpiId")}
              </Button>
            </div>
            <p className="text-center text-xs text-fg-secondary">{t("dialogs.paymentQr.upiDisclaimer")}</p>
          </div>
        ) : (
          target.currency === "INR" && (
            <p className="rounded-md border border-dashed border-line p-3 text-xs text-fg-secondary">
              {t("dialogs.paymentQr.noUpiNotice", { name: target.toName })}
            </p>
          )
        )}

        <div className="flex flex-col gap-2">
          <p className="rounded-md border border-line bg-subtle p-2.5 text-xs text-fg">{reminderText}</p>
          <Button
            variant="secondary"
            size="small"
            icon={copiedReminder ? <Check /> : <Copy />}
            onClick={() => void copyText(reminderText, "reminder")}
          >
            {t("dialogs.paymentQr.copyReminder")}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
