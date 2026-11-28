// Dialog allowing any participant of a direct or shared split to log strictly their own share to personal Expenses.

import { Button, Dialog, SelectField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { type FormEvent, useMemo, useState } from "react"

import { CategorySelect } from "@/features/categories"
import { PAYMENT_METHOD_LABELS } from "@/shared/api/contracts.gen"
import type { Schemas } from "@/shared/api/http"
import { paymentMethodValues } from "@/shared/api/schema.gen"
import { useLanguage } from "@/shared/i18n"
import { toast } from "@/shared/lib/toast"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { SplitExpense } from "../../api"
import { useRecordMyShare } from "../../queries"

type PaymentMethod = Schemas["PaymentMethod"]

const FORM_ID = "log-my-share-form"

/** Props for logging caller's own share of an existing split into personal Expenses & Budgets. */
export interface LogMyShareDialogProps {
  split: SplitExpense | null
  onClose: () => void
}

/** Records strictly the signed-in user's `my_share` into personal Expenses and displays any budget-watch alerts. */
export function LogMyShareDialog({ split, onClose }: LogMyShareDialogProps) {
  const t = useTranslations("splits")
  const tCommon = useTranslations("common")
  const { language } = useLanguage()
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const record = useRecordMyShare()
  const [categoryId, setCategoryId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")

  const labels = PAYMENT_METHOD_LABELS[language]
  const methodOptions = useMemo<SelectOption[]>(
    () => paymentMethodValues.map((method) => ({ value: method, label: labels[method] })),
    [labels],
  )

  if (!split) return null

  const formattedShare = formatMoney(split.my_share, split.currency)

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
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      size="narrow"
      title={t("dialogs.logShare.title")}
      description={t("dialogs.logShare.description", { amount: formattedShare })}
      closeLabel={tCommon("ui.close")}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("dialogs.cancel")}
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} disabled={!categoryId} isLoading={record.isPending}>
            {record.isPending ? t("dialogs.saving") : t("dialogs.logShare.submit")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <CategorySelect label={t("dialogs.logShare.categoryLabel")} value={categoryId} onChange={setCategoryId} />
        <SelectField
          label={t("dialogs.logShare.paymentMethodLabel")}
          options={methodOptions}
          value={paymentMethod}
          onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
          size="small"
        />
      </form>
    </Dialog>
  )
}
