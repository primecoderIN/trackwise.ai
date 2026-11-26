// Settlement reminder & optional INR UPI QR dialog (D225).
// Always encodes the actual outstanding settlement amount, never assumes payment completion, and works globally via
// one-click Copy Reminder for all currencies.

import { Check, Copy, ExternalLink, QrCode } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { useFormatters } from "@/shared/lib/use-formatters"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

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
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-4" />
            {t("dialogs.paymentQr.title")}
          </DialogTitle>
          <DialogDescription>{t("dialogs.paymentQr.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">
              {t("dialogs.paymentQr.summaryLine", {
                from: target.fromName,
                to: target.toName,
                amount: formattedAmount,
              })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("dialogs.paymentQr.contextLine", { context: target.contextLabel })}
            </p>
          </div>

          {upiUri && target.toUpiId ? (
            <div className="flex flex-col items-center gap-3 rounded-md border p-4">
              <UpiQrSvg
                uri={upiUri}
                label={t("dialogs.paymentQr.qrLabel", { name: target.toName, amount: formattedAmount })}
              />
              <p className="font-mono text-xs text-muted-foreground">{target.toUpiId}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild size="sm" variant="default">
                  <a href={upiUri}>
                    <ExternalLink className="size-3.5" />
                    {t("dialogs.paymentQr.openUpiApp")}
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => void copyText(target.toUpiId!, "upi")}>
                  {copiedUpi ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {t("dialogs.paymentQr.copyUpiId")}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">{t("dialogs.paymentQr.upiDisclaimer")}</p>
            </div>
          ) : (
            target.currency === "INR" && (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                {t("dialogs.paymentQr.noUpiNotice", { name: target.toName })}
              </p>
            )
          )}

          <div className="flex flex-col gap-2">
            <p className="rounded-md border bg-muted/30 p-2.5 text-xs">{reminderText}</p>
            <Button variant="outline" size="sm" onClick={() => void copyText(reminderText, "reminder")}>
              {copiedReminder ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {t("dialogs.paymentQr.copyReminder")}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("dialogs.close")}
          </Button>
          {onRecordSettlement && (
            <Button
              onClick={() => {
                onClose()
                onRecordSettlement()
              }}
            >
              {t("dialogs.paymentQr.recordNow")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
