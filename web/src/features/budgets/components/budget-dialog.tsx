// A component of the budgets feature: the "Set limit" / "Change limit" button and dialog, with currency-prefixed
// numeric input and clear Save / Remove actions. Used by the overall card and the category rows.

import { useTranslations } from "next-intl"
import { useId } from "react"

import { LabeledField } from "@/shared/components/labeled-field"
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
  const id = useId()
  const editor = useBudgetEditor(scope, currentLimit)
  const hasLimit = currentLimit !== null
  const busy = editor.saving || editor.removing

  return (
    <Dialog open={editor.open} onOpenChange={editor.onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t(hasLimit ? "dialog.changeFor" : "dialog.setFor", { name })}>
          {t(hasLimit ? "dialog.change" : "dialog.set")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={editor.onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("dialog.title", { name })}</DialogTitle>
            <DialogDescription>{t("dialog.description", { currency })}</DialogDescription>
          </DialogHeader>
          <LabeledField id={id} label={t("dialog.limit")}>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground"
              >
                {currency}
              </span>
              <Input
                id={id}
                inputMode="decimal"
                placeholder="500.00"
                className="pl-12 tabular-nums"
                value={editor.limit}
                onChange={(e) => editor.setLimit(e.target.value)}
              />
            </div>
          </LabeledField>
          <DialogFooter className="gap-2">
            {hasLimit && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto"
                disabled={busy}
                onClick={editor.onRemove}
              >
                {editor.removing ? t("dialog.removing") : t("dialog.remove")}
              </Button>
            )}
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={busy}>
                {t("dialog.cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!editor.limit.trim() || busy}>
              {editor.saving ? t("dialog.saving") : t("dialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
