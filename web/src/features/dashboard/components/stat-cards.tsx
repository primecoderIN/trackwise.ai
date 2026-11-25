// A component of the dashboard feature: the row of three stat cards at the top of the Dashboard. Used by the
// Dashboard page.

import { ReceiptText, TrendingUp, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import type { MonthlySummary } from "../api"

/**
 * Three headline numbers for the current month, all straight from the backend's summary: the total spent, how many
 * expenses (and categories used), and the top category with its total.
 */
export function StatCards({ summary }: { summary: MonthlySummary }) {
  const t = useTranslations("dashboard")
  const { formatCount, formatMoney, formatMonth } = useFormatters()
  const top = summary.by_category[0] // the list comes biggest first
  const monthName = formatMonth(summary.month)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="grid gap-1">
            <CardDescription>{t("stats.spentIn", { month: monthName })}</CardDescription>
            <CardTitle className="text-3xl tracking-tight tabular-nums">
              {formatMoney(summary.total, summary.currency)}
            </CardTitle>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="size-4" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {summary.expense_count === 0 ? t("stats.noExpensesThisMonth") : t("stats.totalOfMonth")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="grid gap-1">
            <CardDescription>{t("stats.expensesThisMonth")}</CardDescription>
            <CardTitle className="text-3xl tracking-tight tabular-nums">{formatCount(summary.expense_count)}</CardTitle>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ReceiptText className="size-4" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("stats.categoriesUsed", { count: summary.by_category.length })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="min-w-0 grid gap-1">
            <CardDescription>{t("stats.topCategory")}</CardDescription>
            <CardTitle className="truncate text-3xl tracking-tight" title={top?.category_name}>
              {top ? top.category_name : "—"}
            </CardTitle>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="size-4" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {top
            ? t("stats.topAcross", { amount: formatMoney(top.total, summary.currency), count: top.expense_count })
            : t("stats.nothingSpent")}
        </CardContent>
      </Card>
    </div>
  )
}
