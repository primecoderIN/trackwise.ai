// A component of the expenses feature: the "Add expense" button and dialog using CurrencySelect, DatePicker,
// CategorySelect, PaymentMethodSelect, and a text area for notes. Used by ExpensesPage.

import { Button, Dialog, TextAreaField, TextField } from "@primecoderin/fast-ui-react"
import { toast } from "@/shared/lib/toast"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"

import { useSignedInUser } from "@/features/auth"
import { CategorySelect } from "@/features/categories"
import { DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { DatePicker } from "@/shared/components/date-picker"
import { LabeledField } from "@/shared/components/labeled-field"
import { todayIso } from "@/shared/lib/format"
import { useMessageOf } from "@/shared/lib/use-message-of"

import { emptyDraft, isComplete, toNewExpense } from "../../expense-form"
import { useCreateExpense } from "../../queries"
import { showSaveNotices } from "../../save-notices"
import { useExpenseDraft, type ExpenseDraftState } from "../../use-expense-draft"
import { PaymentMethodSelect } from "../fields/payment-method-select"

const EXAMPLE_AMOUNT = "24.50"
const FORM_ID = "add-expense-form"

/**
 * The Add expense button and dialog. Uses CurrencySelect and calendar DatePicker; keeps the draft on Cancel and
 * clears it on Save.
 */
export function AddExpenseDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  open?: boolean
  onOpenChange?: (next: boolean) => void
} = {}) {
  const t = useTranslations("expenses")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const defaultCurrency = useSignedInUser().data?.default_currency ?? DEFAULT_CURRENCY
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen
  const { draft, setField, reset } = useExpenseDraft(() => emptyDraft(todayIso(), defaultCurrency))
  const create = useCreateExpense()

  function handleOpenChange(next: boolean) {
    if (!next && create.isPending) return
    if (next && draft.amount === "" && draft.merchant === "" && draft.note === "") {
      setField("spent_on", todayIso())
      setField("currency", defaultCurrency)
    }
    setOpen(next)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (create.isPending || !isComplete(draft)) return
    create.mutate(toNewExpense(draft), {
      onSuccess: (saved) => {
        toast.success(t("add.added"))
        showSaveNotices(saved.notices ?? [])
        setOpen(false)
        reset()
      },
      onError: (error) => toast.error(messageOf(error)),
    })
  }

  return (
    <>
      <Button variant="primary" icon={<Plus />} onClick={() => handleOpenChange(true)}>
        {t("add.open")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        size="narrow"
        title={t("add.title")}
        description={t("add.description", { currency: draft.currency || defaultCurrency, example: EXAMPLE_AMOUNT })}
        closeLabel={tCommon("ui.close")}
        actions={
          <>
            <Button variant="secondary" disabled={create.isPending} onClick={() => handleOpenChange(false)}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form={FORM_ID}
              disabled={!isComplete(draft)}
              isLoading={create.isPending}
            >
              {create.isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit}>
          <AddExpenseFields draft={draft} setField={setField} />
        </form>
      </Dialog>
    </>
  )
}

function AddExpenseFields({ draft, setField }: Pick<ExpenseDraftState, "draft" | "setField">) {
  const t = useTranslations("expenses")
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("fields.amount")}
          inputMode="decimal"
          placeholder={EXAMPLE_AMOUNT}
          value={draft.amount}
          onValueChange={(value) => setField("amount", value)}
          size="small"
        />
        <LabeledField id="add-currency" label={t("fields.currency")}>
          <CurrencySelect
            id="add-currency"
            value={draft.currency}
            onChange={(currency) => setField("currency", currency)}
            ariaLabel={t("fields.currency")}
          />
        </LabeledField>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label={t("fields.merchant")}
          maxLength={100}
          placeholder={t("add.merchantExample")}
          value={draft.merchant}
          onValueChange={(value) => setField("merchant", value)}
          size="small"
        />
        <LabeledField id="add-date" label={t("fields.date")}>
          <DatePicker
            id="add-date"
            value={draft.spent_on}
            ariaLabel={t("fields.date")}
            onChange={(value) => setField("spent_on", value)}
          />
        </LabeledField>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CategorySelect
          label={t("fields.category")}
          value={draft.category_id}
          onChange={(value) => setField("category_id", value)}
        />
        <PaymentMethodSelect
          label={t("fields.paidWith")}
          value={draft.payment_method}
          onChange={(value) => setField("payment_method", value)}
        />
      </div>

      <TextAreaField
        label={t("fields.noteOptional")}
        rows={2}
        maxLength={500}
        placeholder={t("add.noteExample")}
        resize="none"
        value={draft.note}
        onValueChange={(value) => setField("note", value)}
        size="small"
      />
    </div>
  )
}
