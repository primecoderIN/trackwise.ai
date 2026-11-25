// A component of the expenses feature: the "Add expense" button and the dialog it opens, a form for the amount,
// date, merchant, category, payment method and note. Used by the Expenses page, next to its title. Its texts come
// from the feature's i18n namespace.

import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { useSignedInUser } from "@/features/auth"
import { CategorySelect } from "@/features/categories"
import { DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
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

import { emptyDraft, isComplete, toNewExpense } from "../../expense-form"
import { useCreateExpense } from "../../queries"
import { showSaveNotices } from "../../save-notices"
import { useExpenseDraft, type ExpenseDraftState } from "../../use-expense-draft"
import { PaymentMethodSelect } from "../fields/payment-method-select"

// A blank draft dated today. A function, so "today" is worked out each time the form starts again, not once.
// An amount as it's typed in (the description and the Amount placeholder show it). Not translated: the backend
// reads amounts written this way, whatever the language.
const EXAMPLE_AMOUNT = "24.50"

/**
 * The Add expense button and its dialog. Save is enabled once the required fields are filled in (the backend
 * checks the rest). On success the dialog closes, a toast says so, and the form starts empty again; on failure
 * the backend's reason shows as a toast and the dialog stays open with what you typed. Cancel keeps the draft
 * for next time. The list reloads by itself, because the mutation declares that it changed expenses.
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
  // Whether the dialog is open; the draft lives in useExpenseDraft, so closing the dialog keeps it.
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

  // Save (the button, or Enter in a text box): send the draft as a new expense.
  function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser's default form submit, which would reload the page
    if (create.isPending || !isComplete(draft)) return
    create.mutate(toNewExpense(draft), {
      onSuccess: (saved) => {
        toast.success(t("add.added"))
        showSaveNotices(saved.notices ?? [])
        setOpen(false)
        reset()
      },
      // e.g. "Amount must be greater than 0", straight from the backend's rules. The dialog stays open.
      onError: (error) => toast.error(messageOf(error)),
    })
  }

  // Save shows "Saving…" and waits while the request runs; Cancel only closes the dialog (the draft stays).
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> {t("add.open")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("add.title")}</DialogTitle>
            <DialogDescription>
              {t("add.description", { currency: draft.currency || defaultCurrency, example: EXAMPLE_AMOUNT })}
            </DialogDescription>
          </DialogHeader>

          <AddExpenseFields draft={draft} setField={setField} defaultCurrency={defaultCurrency} />

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

// The form's fields, between its header and its buttons. Amount, currency and date share a row, as do category and
// payment method; each control's id ties it to its label.
function AddExpenseFields({
  draft,
  setField,
  defaultCurrency,
}: Pick<ExpenseDraftState, "draft" | "setField"> & { defaultCurrency: string }) {
  const t = useTranslations("expenses")
  return (
    <>
      <div className="grid grid-cols-[1fr_5.5rem_1fr] gap-3">
        <LabeledField id="add-amount" label={t("fields.amount")}>
          <Input
            id="add-amount"
            inputMode="decimal"
            placeholder={EXAMPLE_AMOUNT}
            value={draft.amount}
            onChange={(event) => setField("amount", event.target.value)}
          />
        </LabeledField>
        <LabeledField id="add-currency" label={t("fields.currency")}>
          <Input
            id="add-currency"
            maxLength={3}
            className="uppercase"
            placeholder={defaultCurrency}
            value={draft.currency}
            onChange={(event) => setField("currency", event.target.value.toUpperCase())}
          />
        </LabeledField>
        <LabeledField id="add-date" label={t("fields.date")}>
          <Input
            id="add-date"
            type="date"
            value={draft.spent_on}
            onChange={(event) => setField("spent_on", event.target.value)}
          />
        </LabeledField>
      </div>

      <LabeledField id="add-merchant" label={t("fields.merchant")}>
        <Input
          id="add-merchant"
          maxLength={100}
          placeholder={t("add.merchantExample")}
          value={draft.merchant}
          onChange={(event) => setField("merchant", event.target.value)}
        />
      </LabeledField>

      <div className="grid grid-cols-2 gap-3">
        <LabeledField id="add-category" label={t("fields.category")}>
          <CategorySelect
            id="add-category"
            value={draft.category_id}
            onChange={(value) => setField("category_id", value)}
          />
        </LabeledField>
        <LabeledField id="add-payment" label={t("fields.paidWith")}>
          <PaymentMethodSelect
            id="add-payment"
            value={draft.payment_method}
            onChange={(value) => setField("payment_method", value)}
          />
        </LabeledField>
      </div>

      <LabeledField id="add-note" label={t("fields.noteOptional")}>
        <Input
          id="add-note"
          maxLength={500}
          placeholder={t("add.noteExample")}
          value={draft.note}
          onChange={(event) => setField("note", event.target.value)}
        />
      </LabeledField>
    </>
  )
}
