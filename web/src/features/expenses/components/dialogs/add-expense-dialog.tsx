// A component of the expenses feature: the "Add expense" button and dialog using CurrencySelect, DatePicker,
// CategorySelect, PaymentMethodSelect, and Textarea for notes. Used by ExpensesPage.

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { useSignedInUser } from "@/features/auth"
import { CategorySelect } from "@/features/categories"
import { DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { DatePicker } from "@/shared/components/date-picker"
import { LabeledField } from "@/shared/components/labeled-field"
import { todayIso } from "@/shared/lib/format"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"

import { emptyDraft, isComplete, toNewExpense } from "../../expense-form"
import { useCreateExpense } from "../../queries"
import { showSaveNotices } from "../../save-notices"
import { useExpenseDraft, type ExpenseDraftState } from "../../use-expense-draft"
import { PaymentMethodSelect } from "../fields/payment-method-select"

const EXAMPLE_AMOUNT = "24.50"

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t("add.open")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("add.title")}</DialogTitle>
            <DialogDescription>
              {t("add.description", { currency: draft.currency || defaultCurrency, example: EXAMPLE_AMOUNT })}
            </DialogDescription>
          </DialogHeader>

          <AddExpenseFields draft={draft} setField={setField} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={create.isPending}>
                {t("actions.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isComplete(draft) || create.isPending}>
              {create.isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddExpenseFields({ draft, setField }: Pick<ExpenseDraftState, "draft" | "setField">) {
  const t = useTranslations("expenses")
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledField id="add-amount" label={t("fields.amount")}>
          <Input
            id="add-amount"
            inputMode="decimal"
            placeholder={EXAMPLE_AMOUNT}
            className="tabular-nums"
            value={draft.amount}
            onChange={(event) => setField("amount", event.target.value)}
          />
        </LabeledField>
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
        <LabeledField id="add-merchant" label={t("fields.merchant")}>
          <Input
            id="add-merchant"
            maxLength={100}
            placeholder={t("add.merchantExample")}
            value={draft.merchant}
            onChange={(event) => setField("merchant", event.target.value)}
          />
        </LabeledField>
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
        <LabeledField id="add-category" label={t("fields.category")}>
          <CategorySelect
            id="add-category"
            className="w-full"
            value={draft.category_id}
            onChange={(value) => setField("category_id", value)}
          />
        </LabeledField>
        <LabeledField id="add-payment" label={t("fields.paidWith")}>
          <PaymentMethodSelect
            id="add-payment"
            className="w-full"
            value={draft.payment_method}
            onChange={(value) => setField("payment_method", value)}
          />
        </LabeledField>
      </div>

      <LabeledField id="add-note" label={t("fields.noteOptional")}>
        <Textarea
          id="add-note"
          rows={2}
          maxLength={500}
          placeholder={t("add.noteExample")}
          className="min-h-0 resize-none"
          value={draft.note}
          onChange={(event) => setField("note", event.target.value)}
        />
      </LabeledField>
    </div>
  )
}
