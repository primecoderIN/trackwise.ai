// SpendWise's insights catalog (urn:spendwise:catalog:insights:v1), drawn with @primecoderin/fast-ui-react/charts:
// Chart and Stat. Part of the assistant feature's A2UI renderer; catalogs.ts lists both under INSIGHTS_CATALOG, and
// the surface view draws them like any other component. The agent sends only data and labels; every colour, size and
// style is decided here. The data rules (which points, the unit, the number format) are in insight-data.ts.

import { Card } from "@primecoderin/fast-ui-react"
import { BarChart, DonutChart, LineChart } from "@primecoderin/fast-ui-react/charts"
import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { A2UI } from "@/shared/api/contracts.gen"
import { CardContent } from "@/shared/components/card-parts"
import { pick } from "@/shared/lib/guards"
import { useFormatters } from "@/shared/lib/use-formatters"

import { Unsupported } from "./a2ui-unsupported"
import { formatValue, positivePoints, readPoints, readUnit, type ChartPoint } from "./insight-data"
import type { A2uiRendererProps } from "../renderer-types"

const { chartTypes: CHART, trends: TREND } = A2UI.insights

interface ChartKindProps {
  points: ChartPoint[]
  format: (value: number) => string
  valueLabel: string
}

function BarInsight({ points, format, valueLabel }: ChartKindProps) {
  const data = points.map((point) => ({ label: point.label, value: point.value }))
  return (
    <BarChart
      data={data}
      xKey="label"
      series={[{ key: "value", label: valueLabel }]}
      aria-label={valueLabel}
      height={160}
      formatValue={format}
      hideLegend
      hideGrid
    />
  )
}

function LineInsight({ points, format, valueLabel }: ChartKindProps) {
  const data = points.map((point) => ({ label: point.label, value: point.value }))
  return (
    <LineChart
      data={data}
      xKey="label"
      series={[{ key: "value", label: valueLabel }]}
      aria-label={valueLabel}
      height={160}
      formatValue={format}
      hideLegend
      hideGrid
    />
  )
}

function DonutInsight({ points, format, valueLabel }: ChartKindProps) {
  const slices = points.map((point, index) => ({
    id: `${index}-${point.label}`,
    label: point.label,
    value: point.value,
  }))
  return (
    <DonutChart
      slices={slices}
      aria-label={valueLabel}
      nameLabel={valueLabel}
      valueLabel={valueLabel}
      formatValue={format}
      size={140}
    />
  )
}

const CHART_KINDS: Readonly<Record<string, (props: ChartKindProps) => ReactNode>> = {
  [CHART.bar]: BarInsight,
  [CHART.line]: LineInsight,
  [CHART.donut]: DonutInsight,
}

/**
 * The insights catalog's Chart: a bar, line or donut chart of the points the server sent. A chart with no
 * well-formed points, or of a type not in the contract, becomes a "Can't show …" note.
 */
export function A2uiChart({ node }: A2uiRendererProps) {
  const t = useTranslations("assistant")
  const { locale } = useFormatters()
  const valueLabel = t("cards.chartValue")
  const rawPoints = readPoints(node.data)
  const points = node.chartType === CHART.donut ? positivePoints(rawPoints) : rawPoints
  if (points.length === 0) return <Unsupported reason="chartWithoutData" />
  const ChartKind = pick(CHART_KINDS, node.chartType)
  if (!ChartKind) return <Unsupported reason="chartKind" />
  const unit = readUnit(node.unit)
  const format = (value: number) => formatValue(value, unit, locale)
  // oxlint-disable-next-line react/static-components -- the chart comes from the fixed CHART_KINDS table
  return <ChartKind points={points} format={format} valueLabel={valueLabel} />
}

function TrendIcon({ trend }: { trend: unknown }) {
  const className = "size-3 shrink-0"
  switch (trend) {
    case TREND.up:
      return <TrendingUp className={className} />
    case TREND.down:
      return <TrendingDown className={className} />
    case TREND.flat:
      return <Minus className={className} />
    default:
      return null
  }
}

function textProp(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/** The insights catalog's Stat: one number worth noticing, as a small card with its label and how it changed. */
export function A2uiStat({ node }: A2uiRendererProps) {
  const change = textProp(node.change)
  return (
    <Card padding="medium" className="min-w-0 flex-1 bg-subtle shadow-none">
      <CardContent className="flex flex-col gap-1">
        <span className="text-[11px] font-medium tracking-wide text-fg-secondary uppercase">
          {textProp(node.label)}
        </span>
        <span className="truncate text-lg font-bold tracking-tight tabular-nums">{textProp(node.value)}</span>
        {change && (
          <span className="flex items-center gap-1 text-xs text-fg-secondary">
            <TrendIcon trend={node.trend} />
            {change}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
