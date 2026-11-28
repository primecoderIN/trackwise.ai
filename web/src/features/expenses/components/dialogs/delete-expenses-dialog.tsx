// A component of the expenses feature: the "are you sure?" dialog before deleting one expense or several. It
// runs the delete and reports what happened. Used by the Expenses page, which opens it from the table's buttons.
// Its texts (and the toasts' counts, in each language's plural forms) come from the feature's i18n namespace.

import { Button, Dialog } from "@primecoderin/fast-ui-react"
import { toast } from "@/shared/lib/toast"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { Expense } from "../../api"
import { useDeleteExpenses } from "../../queries"

interface DeleteExpensesDialogProps {
  /** The expenses to delete; null while the dialog is closed. */
  expenses: Expense[] | null
  /** Closes the dialog (Cancel, Escape, or Delete, which closes it first). */
  onClose: () => void
}

/**
 * "Are you sure?" before deleting one expense or several: a delete can't be undone. Open while `expenses` isn't
 * null. For one expense it names it (merchant, amount, date); for several it counts them. Delete closes the
 * dialog at once and deletes in the background, then toasts how many were deleted and, separately, how many
 * couldn't be (with the first reason): a partial success shows both.
 */
export function DeleteExpensesDialog({ expenses, onClose }: DeleteExpensesDialogProps) {
  const t = useTranslations("expenses")
  const messageOf = useMessageOf()
  const { formatDate, formatMoney } = useFormatters()
  const remove = useDeleteExpenses()
  // What the dialog shows. It keeps the last list while it fades out after closing, so the text doesn't
  // flash "Delete 0 expenses?" (React's "adjust state when a prop changes" pattern, during render).
  const [shown, setShown] = useState<Expense[]>(expenses ?? [])
  if (expenses !== null && expenses !== shown) setShown(expenses)
  // One expense is named in the text; several are only counted.
  const single = shown.length === 1 ? shown[0] : null

  // Close first, then delete. While the delete runs, the table disables its delete buttons (it watches this
  // mutation, through useIsDeletingExpenses), so the same rows can't be sent for deleting twice.
  function confirm() {
    const ids = shown.map((expense) => expense.id)
    onClose()
    // Only onSuccess: the mutation resolves even when some deletes fail, and lists the failures (useDeleteExpenses).
    remove.mutate(ids, {
      onSuccess: ({ deleted, failures }) => {
        if (deleted > 0) toast.success(t("delete.deleted", { count: deleted }))
        if (failures.length > 0) {
          toast.error(t("delete.failed", { count: failures.length, reason: messageOf(failures[0]) }))
        }
      },
    })
  }

  // One expense is named (merchant, amount, date) in the same sentence as the warning, so each language can order
  // them its own way.
  const description = single
    ? t("delete.describeOne", {
        merchant: single.merchant,
        amount: formatMoney(single.amount, single.currency),
        date: formatDate(single.spent_on),
      })
    : t("delete.describeSeveral")

  return (
    <Dialog
      open={expenses !== null}
      onOpenChange={(open) => !open && onClose()}
      modalType="alert"
      size="narrow"
      title={single ? t("delete.titleOne") : t("delete.titleSeveral", { count: shown.length })}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("actions.cancel")}
          </Button>
          <Button variant="destructive" onClick={confirm}>
            {t("actions.delete")}
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-secondary">{description}</p>
    </Dialog>
  )
}
