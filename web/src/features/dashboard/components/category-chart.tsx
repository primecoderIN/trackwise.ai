// A component of the dashboard feature: the "Spending by category" card with colour-coded horizontal bars, inline
// amounts and percentages, and click-to-filter drill-down into the Expenses page. Used by DashboardPage.

import { Card } from "@primecoderin/fast-ui-react"
import { BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { categoryVisual, useCategoryLookup } from "@/features/categories"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { EmptyState } from "@/shared/components/empty-state"
import { ROUTES } from "@/shared/config/routes"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { monthDateRange } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"

import type { MonthlySummary } from "../api"

const CATEGORY_AXIS_WIDTH = 112
const CATEGORY_AXIS_WIDTH_MOBILE = 80
const BAR_RIGHT_MARGIN = 86
const BAR_RIGHT_MARGIN_MOBILE = 58

interface TooltipPayloadItem {
  value?: number
  payload?: { name?: string; color?: string }
}

function CategoryTooltip({
  active,
  payload,
  currency,
  formatMoney,
}: {
  active?: boolean
  payload?: readonly TooltipPayloadItem[]
  currency: string
  formatMoney: (value: number, currency: string) => string
}) {
  const item = payload?.[0]
  if (!active || !item || typeof item.value !== "number") return null
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-xs text-fg shadow-md">
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.payload?.color }} />
        <span className="font-medium">{item.payload?.name}</span>
        <span className="font-mono font-semibold tabular-nums">{formatMoney(item.value, currency)}</span>
      </div>
    </div>
  )
}

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
          <div className="w-full" style={{ height: `${Math.max(256, rows.length * 40)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
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
                  tick={{ fill: "var(--fast-chart-axis)", fontSize: isMobile ? 11 : 12 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--fast-bg-muted)", opacity: 0.45 }}
                  content={<CategoryTooltip currency={summary.currency} formatMoney={formatMoney} />}
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
                    className="fill-fg-secondary text-[11px] font-medium tabular-nums"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
