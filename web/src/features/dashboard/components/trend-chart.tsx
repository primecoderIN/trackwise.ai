// A component of the dashboard feature: the "Monthly trend" card, rendered with @primecoderin/fast-ui-react/charts'
// AreaChart (theme tokens, accessible data table, and responsive hover tooltips). Used by the Dashboard page.

import { Card } from "@primecoderin/fast-ui-react"
import { AreaChart } from "@primecoderin/fast-ui-react/charts"
import { TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"

import { CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { EmptyState } from "@/shared/components/empty-state"
import { ROUTES } from "@/shared/config/routes"
import { useFormatters } from "@/shared/lib/use-formatters"

import type { MonthlyTrend } from "../api"

/**
 * "Monthly trend": total spent across recent months rendered as a soft gradient area chart with interactive hover
 * tooltips and a screen-reader data table.
 */
export function TrendChart({ trend }: { trend: MonthlyTrend }) {
  const t = useTranslations("dashboard")
  const { formatCompactMoney, formatMoney, formatMonth } = useFormatters()
  const count = trend.months.length
  const rows = trend.months.map((m) => ({
    label: formatMonth(m.month, "short"),
    total: Number(m.total),
  }))
  const nothingSpent = trend.months.every((m) => m.total_minor === 0)
  const average = rows.length > 0 ? rows.reduce((sum, item) => sum + item.total, 0) / rows.length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("trend.title")}</CardTitle>
        <CardDescription>
          {t("trend.lastMonths", { count })}
          {!nothingSpent && average > 0
            ? ` · ${t("trend.averageLabel", { amount: formatCompactMoney(average, trend.currency) })}`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {nothingSpent ? (
          <EmptyState
            icon={TrendingUp}
            message={t("trend.empty", { count })}
            action={{ label: t("addExpense"), to: `${ROUTES.expenses}?add=1`, primary: true }}
          />
        ) : (
          <AreaChart
            data={rows}
            xKey="label"
            xLabel={t("trend.title")}
            series={[{ key: "total", label: t("charts.spent"), color: "var(--fast-chart-1)" }]}
            aria-label={t("trend.title")}
            height={256}
            formatValue={(value) => formatMoney(value, trend.currency)}
            hideLegend
          />
        )}
      </CardContent>
    </Card>
  )
}
