// A component of the dashboard feature: the "Monthly trend" card, a smooth gradient area chart with a dashed
// period-average reference line (shadcn charts over Recharts). Used by the Dashboard page.

import { TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts"

import { EmptyState } from "@/shared/components/empty-state"
import { ROUTES } from "@/shared/config/routes"
import { useIsMobile } from "@/shared/hooks/use-mobile"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/ui/chart"

import type { MonthlyTrend } from "../api"
import { useSpentConfig } from "./chart-config"

const MONEY_AXIS_WIDTH = 60
const MONEY_AXIS_WIDTH_MOBILE = 48

/**
 * "Monthly trend": total spent across recent months rendered as a soft gradient area chart with an average
 * reference line and interactive hover tooltips.
 */
export function TrendChart({ trend }: { trend: MonthlyTrend }) {
  const t = useTranslations("dashboard")
  const isMobile = useIsMobile()
  const { formatCompactMoney, formatMoney, formatMonth } = useFormatters()
  const config = useSpentConfig()
  const count = trend.months.length
  const rows = trend.months.map((m) => ({
    label: formatMonth(m.month, "short"),
    fullLabel: formatMonth(m.month),
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
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <AreaChart data={rows} margin={{ left: 4, right: 12, top: 10, bottom: 0 }} accessibilityLayer>
              <defs>
                <linearGradient id="dashboardTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/70" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
                tick={{ fontSize: isMobile ? 11 : 12 }}
              />
              <YAxis
                width={isMobile ? MONEY_AXIS_WIDTH_MOBILE : MONEY_AXIS_WIDTH}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: isMobile ? 11 : 12 }}
                tickFormatter={(value: number) => formatCompactMoney(value, trend.currency)}
              />
              {average > 0 && (
                <ReferenceLine
                  y={average}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.45}
                />
              )}
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel}
                    formatter={(value) => formatMoney(Number(value), trend.currency)}
                  />
                }
              />
              <Area
                dataKey="total"
                type="monotone"
                stroke="var(--color-total)"
                strokeWidth={2.5}
                fill="url(#dashboardTrendFill)"
                dot={{ r: 3.5, fill: "var(--card)", stroke: "var(--color-total)", strokeWidth: 2 }}
                activeDot={{ r: 5, fill: "var(--color-total)", stroke: "var(--card)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
