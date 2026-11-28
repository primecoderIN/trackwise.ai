// A component of the expenses feature: slide-over drawer for editing a single expense without overflowing the table
// horizontally (works seamlessly on mobile and alongside an open Assistant panel). Used by expenses-table.tsx.

import { Button, Drawer, TextAreaField, TextField } from "@primecoderin/fast-ui-react"
import { Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, type SubmitEvent } from "react"

import { CategorySelect } from "@/features/categories"
import { CurrencySelect } from "@/shared/components/currency-select"
import { DatePicker } from "@/shared/components/date-picker"
import { LabeledField } from "@/shared/components/labeled-field"

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
  if (!shown) return null

  return (
    <EditExpenseDrawer
      key={shown.id}
      open={expense !== null}
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
  )
}

function EditExpenseDrawer({
  open,
  expense: initial,
  saving,
  deleting,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !complete) return
    onSave(changes)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && !saving && onClose()}
      side="end"
      title={t("edit.title", { id: snapshot.id })}
      className="w-[min(28rem,100vw)]"
      onSubmit={handleSubmit}
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <Button
            variant="subtle"
            size="small"
            icon={<Trash2 />}
            disabled={saving || deleting}
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            {t("actions.delete")}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="small" disabled={saving} onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button variant="primary" type="submit" size="small" disabled={!complete || !dirty} isLoading={saving}>
              {saving ? t("actions.saving") : t("actions.save")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm text-fg-secondary">{t("edit.description")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label={t("fields.amount")}
            inputMode="decimal"
            value={draft.amount}
            onValueChange={(value) => setField("amount", value)}
            size="small"
          />
          <LabeledField id="edit-currency" label={t("fields.currency")}>
            <CurrencySelect
              id="edit-currency"
              value={draft.currency}
              onChange={(currency) => setField("currency", currency)}
              ariaLabel={t("edit.currency", { id: snapshot.id })}
            />
          </LabeledField>
        </div>

        <TextField
          label={t("fields.merchant")}
          maxLength={100}
          value={draft.merchant}
          onValueChange={(value) => setField("merchant", value)}
          size="small"
        />

        <LabeledField id="edit-date" label={t("fields.date")}>
          <DatePicker
            id="edit-date"
            value={draft.spent_on}
            ariaLabel={t("edit.date", { id: snapshot.id })}
            onChange={(value) => setField("spent_on", value)}
          />
        </LabeledField>

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
          rows={3}
          maxLength={500}
          resize="none"
          value={draft.note}
          onValueChange={(value) => setField("note", value)}
          size="small"
        />
      </div>
    </Drawer>
  )
}
