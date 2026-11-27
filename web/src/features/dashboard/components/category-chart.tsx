// A component of the dashboard feature: the "Spending by category" card with colour-coded horizontal bars, inline
// amounts and percentages, and click-to-filter drill-down into the Expenses page. Used by DashboardPage.

import { BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"

import { categoryVisual, useCategoryLookup } from "@/features/categories"
import { EmptyState } from "@/shared/components/empty-state"
import { ROUTES } from "@/shared/config/routes"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { monthDateRange } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/ui/chart"

import type { MonthlySummary } from "../api"
import { useSpentConfig } from "./chart-config"

const CATEGORY_AXIS_WIDTH = 112
const CATEGORY_AXIS_WIDTH_MOBILE = 80
const BAR_RIGHT_MARGIN = 86
const BAR_RIGHT_MARGIN_MOBILE = 58

/**
 * "Spending by category": multi-hue horizontal bars sorted largest first, with inline formatted totals and
 * click-through to the Expenses table filtered by that category and month.
 */
export function CategoryChart({ summary }: { summary: MonthlySummary }) {
  const t = useTranslations("dashboard")
  const router = useRouter()
  const isMobile = useIsMobile()
  const { formatCompactMoney, formatMoney, formatMonth } = useFormatters()
  const categoryOf = useCategoryLookup()
  const config = useSpentConfig()

  const rows = summary.by_category.map((c) => {
    const share = summary.total_minor > 0 ? Math.round((c.total_minor / summary.total_minor) * 100) : 0
    const color = categoryVisual(categoryOf(c.category_id)?.icon).chartColor
    const compact = formatCompactMoney(Number(c.total), summary.currency)
    return {
      id: c.category_id,
      name: c.category_name,
      total: Number(c.total),
      valueLabel: isMobile ? compact : `${compact} (${share}%)`,
      color,
    }
  })

  function openCategory(categoryId: number) {
    const params = new URLSearchParams({ category_id: String(categoryId) })
    const range = monthDateRange(summary.month)
    if (range) {
      params.set("start_date", range.start)
      params.set("end_date", range.end)
    }
    router.push(`${ROUTES.expenses}?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("byCategory.title")}</CardTitle>
        <CardDescription>
          {formatMonth(summary.month)}
          {rows.length > 0 ? ` · ${t("byCategory.hint")}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            message={t("byCategory.empty")}
            action={{ label: t("addExpense"), to: `${ROUTES.expenses}?add=1`, primary: true }}
          />
        ) : (
          <ChartContainer
            config={config}
            className="aspect-auto w-full"
            style={{ height: `${Math.max(256, rows.length * 40)}px` }}
          >
            <BarChart
              data={rows}
              layout="vertical"
              margin={{
                left: isMobile ? 0 : 4,
                right: isMobile ? BAR_RIGHT_MARGIN_MOBILE : BAR_RIGHT_MARGIN,
                top: 4,
                bottom: 4,
              }}
              accessibilityLayer
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={isMobile ? CATEGORY_AXIS_WIDTH_MOBILE : CATEGORY_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: isMobile ? 11 : 12 }}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.45 }}
                content={<ChartTooltipContent formatter={(value) => formatMoney(Number(value), summary.currency)} />}
              />
              <Bar
                dataKey="total"
                radius={[0, 6, 6, 0]}
                barSize={22}
                className="cursor-pointer"
                onClick={(_entry, index) => {
                  const row = rows[index]
                  if (row) openCategory(row.id)
                }}
              >
                {rows.map((row) => (
                  <Cell key={row.id} fill={row.color} />
                ))}
                <LabelList
                  dataKey="valueLabel"
                  position="right"
                  offset={8}
                  className="fill-muted-foreground text-[11px] font-medium tabular-nums"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
