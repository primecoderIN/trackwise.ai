// Dialog allowing any participant of a direct or shared split to log strictly their own share to personal Expenses.

import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { CategorySelect } from "@/features/categories"
import { PAYMENT_METHOD_LABELS } from "@/shared/api/contracts.gen"
import type { Schemas } from "@/shared/api/http"
import { paymentMethodValues } from "@/shared/api/schema.gen"

type PaymentMethod = Schemas["PaymentMethod"]
import { LabeledField } from "@/shared/components/labeled-field"
import { useLanguage } from "@/shared/i18n"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

import type { SplitExpense } from "../../api"
import { useRecordMyShare } from "../../queries"

/** Props for logging caller's own share of an existing split into personal Expenses & Budgets. */
export interface LogMyShareDialogProps {
  split: SplitExpense | null
  onClose: () => void
}

/** Records strictly the signed-in user's `my_share` into personal Expenses and displays any budget-watch alerts. */
export function LogMyShareDialog({ split, onClose }: LogMyShareDialogProps) {
  const t = useTranslations("splits")
  const { language } = useLanguage()
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const record = useRecordMyShare()
  const [categoryId, setCategoryId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")

  if (!split) return null

  const formattedShare = formatMoney(split.my_share, split.currency)
  const labels = PAYMENT_METHOD_LABELS[language]

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!split || !categoryId) {
      toast.error(t("dialogs.split.needCategory"))
      return
    }
    try {
      const saved = await record.mutateAsync({
        splitId: split.id,
        body: { category_id: Number(categoryId), payment_method: paymentMethod },
      })
      toast.success(t("dialogs.logShare.saved"))
      for (const notice of saved.notices) toast.warning(notice)
      onClose()
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.logShare.title")}</DialogTitle>
          <DialogDescription>{t("dialogs.logShare.description", { amount: formattedShare })}</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <LabeledField id="log-share-category" label={t("dialogs.logShare.categoryLabel")}>
            <CategorySelect id="log-share-category" value={categoryId} onChange={setCategoryId} />
          </LabeledField>
          <LabeledField id="log-share-method" label={t("dialogs.logShare.paymentMethodLabel")}>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger id="log-share-method" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethodValues.map((method) => (
                  <SelectItem key={method} value={method}>
                    {labels[method]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </LabeledField>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("dialogs.cancel")}
            </Button>
            <Button type="submit" disabled={record.isPending || !categoryId}>
              {record.isPending ? t("dialogs.saving") : t("dialogs.logShare.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
