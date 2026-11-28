// A component of the budgets feature: the "Set limit" / "Change limit" button and dialog, with currency-prefixed
// numeric input and clear Save / Remove actions. Used by the overall card and the category rows.

import { Button, Dialog, TextField } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { useId } from "react"

import type { BudgetScope } from "../api"
import { useBudgetEditor } from "../use-budget-editor"

interface BudgetDialogProps {
  /** Which budget: a category's id, or null for the overall one. */
  scope: BudgetScope
  /** What the budget is for, as people read it: a category's name, or "all spending". */
  name: string
  /** Currency budgets are measured in (from BudgetStatus). */
  currency: string
  /** The limit now (major units, "2000.00"), or null when there's none. */
  currentLimit: string | null
}

/** The button (its name says which budget, for screen readers) and the dialog: the limit, Save, and Remove. */
export function BudgetDialog({ scope, name, currency, currentLimit }: BudgetDialogProps) {
  const t = useTranslations("budgets")
  const tCommon = useTranslations("common")
  const formId = useId()
  const editor = useBudgetEditor(scope, currentLimit)
  const hasLimit = currentLimit !== null
  const busy = editor.saving || editor.removing

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        aria-label={t(hasLimit ? "dialog.changeFor" : "dialog.setFor", { name })}
        onClick={() => editor.onOpenChange(true)}
      >
        {t(hasLimit ? "dialog.change" : "dialog.set")}
      </Button>
      <Dialog
        open={editor.open}
        onOpenChange={editor.onOpenChange}
        size="narrow"
        title={t("dialog.title", { name })}
        description={t("dialog.description", { currency })}
        closeLabel={tCommon("ui.close")}
        actions={
          <>
            {hasLimit && (
              <Button variant="subtle" className="me-auto" disabled={busy} onClick={editor.onRemove}>
                {editor.removing ? t("dialog.removing") : t("dialog.remove")}
              </Button>
            )}
            <Button variant="secondary" disabled={busy} onClick={() => editor.onOpenChange(false)}>
              {t("dialog.cancel")}
            </Button>
            <Button variant="primary" type="submit" form={formId} disabled={!editor.limit.trim() || busy}>
              {editor.saving ? t("dialog.saving") : t("dialog.save")}
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={editor.onSubmit}>
          <TextField
            label={t("dialog.limit")}
            inputMode="decimal"
            placeholder="500.00"
            value={editor.limit}
            onValueChange={editor.setLimit}
            contentBefore={<span className="text-xs font-semibold text-fg-secondary">{currency}</span>}
          />
        </form>
      </Dialog>
    </>
  )
}
