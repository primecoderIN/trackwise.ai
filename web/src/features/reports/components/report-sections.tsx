// The breakdown cards on the Reports page: spending by category, spending by payment method, and the month's biggest
// expenses. Part of the reports feature (components/).

import { useTranslations } from "next-intl"

import { PAYMENT_METHOD_LABELS } from "@/shared/api/contracts.gen"
import { useLanguage } from "@/shared/i18n"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import type { MonthlyReport } from "../api"

/** The summary stat cards at the top of a monthly report: total spent, comparison with last month, and daily average. */
export function ReportStatCards({ report }: { report: MonthlyReport }) {
  const t = useTranslations("reports")
  const { formatMoney } = useFormatters()
  const prevFormatted = formatMoney(report.previous_total, report.currency)
  const changePercent = report.change_percent
  const changeNum = changePercent !== null ? Number(changePercent) : null
  const changeLine =
    changeNum === null || changePercent === null
      ? t("stats.noPrevious")
      : changeNum > 0
        ? t("stats.changeUp", { percent: changePercent, amount: prevFormatted })
        : changeNum < 0
          ? t("stats.changeDown", { percent: changePercent, amount: prevFormatted })
          : t("stats.changeSame", { amount: prevFormatted })

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("stats.total")}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{formatMoney(report.total, report.currency)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {t("stats.expenses", { count: report.expense_count })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("stats.previousMonth", { amount: prevFormatted })}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {changeNum === null ? "—" : `${changeNum > 0 ? "+" : ""}${report.change_percent}%`}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">{changeLine}</CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>{t("stats.dailyAverage")}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">{formatMoney(report.daily_average, report.currency)}</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {t("stats.daysCounted", { count: report.days_counted })}
        </CardContent>
      </Card>
    </div>
  )
}

/** The category and payment-method breakdown cards, plus the month's biggest individual expenses. */
export function ReportBreakdowns({ report }: { report: MonthlyReport }) {
  const t = useTranslations("reports")
  const { language } = useLanguage()
  const { formatDate, formatMoney, formatMonth } = useFormatters()
  const monthLabel = formatMonth(report.month)
  const labels = PAYMENT_METHOD_LABELS[language]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("byCategory.title")}</CardTitle>
          <CardDescription>{t("byCategory.description", { month: monthLabel })}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {report.by_category.map((row) => (
            <div key={row.category} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{row.category}</span>
                <span className="tabular-nums font-medium">{formatMoney(row.total, report.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("byCategory.count", { count: row.count })}</span>
                {row.share_percent !== null && <span>{t("byCategory.share", { percent: row.share_percent })}</span>}
              </div>
              {row.share_percent !== null && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, Number(row.share_percent)))}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("byPayment.title")}</CardTitle>
            <CardDescription>{t("byPayment.description", { month: monthLabel })}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {report.by_payment_method.map((row) => (
              <div key={row.payment_method} className="flex items-baseline justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium">{labels[row.payment_method]}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t("byPayment.count", { count: row.count })}
                  </span>
                </div>
                <div className="text-right tabular-nums">
                  <span className="font-medium">{formatMoney(row.total, report.currency)}</span>
                  {row.share_percent !== null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {t("byPayment.share", { percent: row.share_percent })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {report.biggest.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("biggest.title")}</CardTitle>
              <CardDescription>{t("biggest.description", { month: monthLabel })}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {report.biggest.map((expense, index) => (
                <div
                  key={`${expense.spent_on}-${expense.merchant}-${index}`}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{expense.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("biggest.categoryAndDate", {
                        category: expense.category,
                        date: formatDate(expense.spent_on),
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatMoney(expense.amount, report.currency)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
