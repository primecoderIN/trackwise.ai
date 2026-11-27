// A component of the expenses feature: slide-over drawer for editing a single expense without overflowing the table
// horizontally (works seamlessly on mobile and alongside an open Assistant panel). Used by expenses-table.tsx.

import { Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"

import { CategorySelect } from "@/features/categories"
import { CurrencySelect } from "@/shared/components/currency-select"
import { DatePicker } from "@/shared/components/date-picker"
import { LabeledField } from "@/shared/components/labeled-field"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/shared/ui/sheet"
import { Textarea } from "@/shared/ui/textarea"

import type { Expense, ExpenseChanges } from "../../api"
import { changesBetween, draftOf, isComplete } from "../../expense-form"
import { useExpenseDraft } from "../../use-expense-draft"
import { PaymentMethodSelect } from "../fields/payment-method-select"

interface EditExpenseSheetProps {
  /** The expense currently being edited; null keeps the drawer closed. */
  expense: Expense | null
  saving: boolean
  deleting: boolean
  onSave: (id: number, changes: ExpenseChanges) => void
  onDelete: (expense: Expense) => void
  onClose: () => void
}

/** Slide-over editor preserving the last expense during close animation so its heading never flickers. */
export function EditExpenseSheet({ expense, saving, deleting, onSave, onDelete, onClose }: EditExpenseSheetProps) {
  const [shown, setShown] = useState<Expense | null>(expense)
  if (expense !== null && expense !== shown) setShown(expense)

  return (
    <Sheet open={expense !== null} onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {shown && (
          <EditExpenseForm
            key={shown.id}
            expense={shown}
            saving={saving}
            deleting={deleting}
            onSave={(changes) => onSave(shown.id, changes)}
            onDelete={() => {
              onClose()
              onDelete(shown)
            }}
            onClose={onClose}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function EditExpenseForm({
  expense: initial,
  saving,
  deleting,
  onSave,
  onDelete,
  onClose,
}: {
  expense: Expense
  saving: boolean
  deleting: boolean
  onSave: (changes: ExpenseChanges) => void
  onDelete: () => void
  onClose: () => void
}) {
  const t = useTranslations("expenses")
  const [snapshot] = useState(initial)
  const { draft, setField } = useExpenseDraft(() => draftOf(initial))
  const complete = isComplete(draft)
  const changes = changesBetween(snapshot, draft)
  const dirty = Object.keys(changes).length > 0

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving || !complete) return
    onSave(changes)
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <SheetHeader className="border-b px-5 py-4">
        <SheetTitle>{t("edit.title", { id: snapshot.id })}</SheetTitle>
        <SheetDescription>{t("edit.description")}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField id="edit-amount" label={t("fields.amount")}>
              <Input
                id="edit-amount"
                inputMode="decimal"
                className="tabular-nums"
                value={draft.amount}
                onChange={(event) => setField("amount", event.target.value)}
              />
            </LabeledField>
            <LabeledField id="edit-currency" label={t("fields.currency")}>
              <CurrencySelect
                id="edit-currency"
                value={draft.currency}
                onChange={(currency) => setField("currency", currency)}
                ariaLabel={t("edit.currency", { id: snapshot.id })}
              />
            </LabeledField>
          </div>

          <LabeledField id="edit-merchant" label={t("fields.merchant")}>
            <Input
              id="edit-merchant"
              maxLength={100}
              value={draft.merchant}
              onChange={(event) => setField("merchant", event.target.value)}
            />
          </LabeledField>

          <LabeledField id="edit-date" label={t("fields.date")}>
            <DatePicker
              id="edit-date"
              value={draft.spent_on}
              ariaLabel={t("edit.date", { id: snapshot.id })}
              onChange={(value) => setField("spent_on", value)}
            />
          </LabeledField>

          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledField id="edit-category" label={t("fields.category")}>
              <CategorySelect
                id="edit-category"
                className="w-full"
                value={draft.category_id}
                onChange={(value) => setField("category_id", value)}
              />
            </LabeledField>
            <LabeledField id="edit-payment" label={t("fields.paidWith")}>
              <PaymentMethodSelect
                id="edit-payment"
                className="w-full"
                value={draft.payment_method}
                onChange={(value) => setField("payment_method", value)}
              />
            </LabeledField>
          </div>

          <LabeledField id="edit-note" label={t("fields.noteOptional")}>
            <Textarea
              id="edit-note"
              rows={3}
              maxLength={500}
              className="min-h-0 resize-none"
              value={draft.note}
              onChange={(event) => setField("note", event.target.value)}
            />
          </LabeledField>
        </div>
      </div>

      <SheetFooter className="flex-row flex-wrap items-center justify-between gap-2 border-t bg-muted/35 px-5 py-3.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={saving || deleting}
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {t("actions.delete")}
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit" size="sm" disabled={!complete || !dirty || saving}>
            {saving ? t("actions.saving") : t("actions.save")}
          </Button>
        </div>
      </SheetFooter>
    </form>
  )
}
