// A part of the expenses feature's table: responsive card-list layout shown below `lg` breakpoints so narrow phone
// and tablet-with-sidebar screens never horizontally scroll a multi-column table. Used by expenses-table.tsx.

import { Button, CheckboxBox, SkeletonItem, Tag } from "@primecoderin/fast-ui-react"
import { Pencil, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { categoryVisual, useCategoryLookup, useCategoryName } from "@/features/categories"
import { ExpenseMoney } from "@/shared/components/money"
import { useLanguage } from "@/shared/i18n"
import { useFormatters } from "@/shared/lib/use-formatters"

import type { Expense } from "../../api"
import { paymentMethodLabel } from "../../payment-methods"

interface ExpenseMobileListProps {
  expenses: Expense[]
  loading: boolean
  deleting: boolean
  selectedIds: Record<string, boolean>
  onToggleSelect: (id: string, checked: boolean) => void
  onEdit: (id: number) => void
  onDelete: (expenses: Expense[]) => void
}

/** Stacked expense cards for mobile screens with selection checkbox, category badge, amount, and quick actions. */
export function ExpenseMobileList({
  expenses,
  loading,
  deleting,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
}: ExpenseMobileListProps) {
  const t = useTranslations("expenses")
  const { language } = useLanguage()
  const { formatDate } = useFormatters()
  const categoryName = useCategoryName()
  const categoryOf = useCategoryLookup()

  if (loading) {
    return (
      <div className="grid gap-2.5 lg:hidden">
        {[0, 1, 2, 3, 4].map((index) => (
          <SkeletonItem key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground lg:hidden">
        {t("table.noMatches")}
      </div>
    )
  }

  return (
    <ul className="grid gap-2.5 lg:hidden">
      {expenses.map((expense) => {
        const key = String(expense.id)
        const checked = Boolean(selectedIds[key])
        const visual = categoryVisual(categoryOf(expense.category_id)?.icon)
        const Icon = visual.icon
        return (
          <li
            key={expense.id}
            className={`rounded-2xl border bg-card p-3.5 shadow-2xs transition-colors ${
              checked ? "border-primary/40 bg-primary/5" : "border-border/80"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-1">
                <CheckboxBox
                  aria-label={t("table.selectRow", { id: expense.id })}
                  checked={checked}
                  onCheckedChange={(value) => onToggleSelect(key, value)}
                />
              </div>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${visual.tileClass}`}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {expense.merchant}{" "}
                      <span className="font-mono text-[11px] font-normal text-muted-foreground">#{expense.id}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {categoryName(expense.category_id)} · {formatDate(expense.spent_on)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right font-semibold tabular-nums">
                    <ExpenseMoney
                      amount={expense.amount}
                      currency={expense.currency}
                      baseAmount={expense.base_amount}
                      rate={expense.exchange_rate}
                      rateDate={expense.rate_date}
                    />
                  </div>
                </div>
                {expense.note && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{expense.note}</p>}
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                  <Tag>{paymentMethodLabel(expense.payment_method, language)}</Tag>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="icon"
                      aria-label={t("table.editRow", { id: expense.id })}
                      onClick={() => onEdit(expense.id)}
                      size="small"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="icon"
                      aria-label={t("table.deleteRow", { id: expense.id })}
                      disabled={deleting}
                      onClick={() => onDelete([expense])}
                      size="small"
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
