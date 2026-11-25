// SpendWise's insights catalog (urn:spendwise:catalog:insights:v1), drawn: Chart and Stat. Part of the
// assistant feature's A2UI renderer; catalogs.ts lists both under INSIGHTS_CATALOG, and the surface view
// draws them like any other component. The agent sends only data and labels; every colour, size and style is
// decided here. The data rules (which points, the unit, the number format) are in insight-data.ts.

import { Minus, TrendingDown, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, type ReactNode } from "react"
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, XAxis } from "recharts"

import { A2UI } from "@/shared/api/contracts.gen"
import { pick } from "@/shared/lib/guards"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Card, CardContent } from "@/shared/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/shared/ui/chart"

import { Unsupported } from "./a2ui-unsupported"
import { formatValue, positivePoints, readPoints, readUnit, type ChartPoint } from "./insight-data"
import type { A2uiRendererProps } from "../renderer-types"

// The chart config: a FIXED key and colour. shadcn's ChartContainer writes the config's keys and colours into a
// <style> tag, so nothing from the agent may ever become a key or a colour: its labels are only drawn as text.
// Only the label is filled in when drawn, and it's our own text (in the language on now), never the server's.
function chartConfig(label: string) {
  return { value: { label, color: "var(--chart-1)" } } satisfies ChartConfig
}

// The theme's five chart colours, for donut slices (more slices simply reuse them). A slice's colour
// comes from its position, never from the server.
const SLICE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const { chartTypes: CHART, trends: TREND } = A2UI.insights

function sliceColor(index: number): string {
  return SLICE_COLORS[index % SLICE_COLORS.length]
}

// What every kind of chart is drawn from: checked points, how to write a value (tooltip, legend), and the
// fixed config (chartConfig).
interface ChartKindProps {
  points: ChartPoint[]
  format: (value: unknown) => string
  config: ChartConfig
}

function renderTooltipRow(value: unknown, name: unknown, format: (v: unknown) => string, config: ChartConfig) {
  const key = typeof name === "string" ? name : ""
  const itemConfig = Object.hasOwn(config, key) ? config[key] : undefined
  const label = itemConfig?.label ?? String(name ?? "")
  return (
    <div className="flex flex-1 items-center justify-between gap-2 leading-none">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground tabular-nums">{format(value)}</span>
    </div>
  )
}

function BarInsight({ points, format, config }: ChartKindProps) {
  return (
    <ChartContainer config={config} className="aspect-auto h-40 w-full">
      <BarChart data={points} accessibilityLayer>
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" fontSize={10} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value, name) => renderTooltipRow(value, name, format, config)} />}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

function LineInsight({ points, format, config }: ChartKindProps) {
  return (
    <ChartContainer config={config} className="aspect-auto h-40 w-full">
      <LineChart data={points} margin={{ left: 8, right: 8, top: 8 }} accessibilityLayer>
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" fontSize={10} />
        <ChartTooltip
          content={<ChartTooltipContent formatter={(value, name) => renderTooltipRow(value, name, format, config)} />}
        />
        <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  )
}

// A donut beside its legend. The legend is also the chart's text version: every slice with its value,
// for screen readers too.
function DonutInsight({ points, format, config }: ChartKindProps) {
  return (
    <div className="flex items-center gap-3">
      <ChartContainer config={config} className="aspect-square h-28 shrink-0">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value, name) => renderTooltipRow(value, name, format, config)}
              />
            }
          />
          <Pie data={points} dataKey="value" nameKey="label" innerRadius="55%" strokeWidth={2}>
            {points.map((point, index) => (
              <Cell key={`${index}-${point.label}`} fill={sliceColor(index)} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
        {points.map((point, index) => (
          <li key={`${index}-${point.label}`} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: sliceColor(index) }} />
            <span className="truncate">{point.label}</span>
            <span className="ml-auto text-muted-foreground tabular-nums">{format(point.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// The chart types the contract allows, each drawn by one component. A new type is one entry here. The
// server's chartType is only ever a key in this table (read with pick()).
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
  // The same config until the language changes, so the chart doesn't rebuild its styles on every render.
  const config = useMemo(() => chartConfig(t("cards.chartValue")), [t])
  const rawPoints = readPoints(node.data)
  const points = node.chartType === CHART.donut ? positivePoints(rawPoints) : rawPoints
  if (points.length === 0) return <Unsupported reason="chartWithoutData" />
  const ChartKind = pick(CHART_KINDS, node.chartType)
  if (!ChartKind) return <Unsupported reason="chartKind" />
  const unit = readUnit(node.unit)
  // The values follow the active locale, so the chart redraws whenever the UI language changes.
  const format = (value: unknown) => formatValue(value, unit, locale)
  // The rule can't see that pick() returns a component from a module-level table: none is created here.
  // oxlint-disable-next-line react/static-components -- the chart comes from the fixed CHART_KINDS table
  return <ChartKind points={points} format={format} config={config} />
}

// The arrow only shows direction. It isn't coloured red or green: whether "up" is good depends on what's measured.
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

// A property shown as text only when it is text; anything else shows as "".
function textProp(value: unknown): string {
  return typeof value === "string" ? value : ""
}

/** The insights catalog's Stat: one number worth noticing, as a small card with its label and how it changed. */
export function A2uiStat({ node }: A2uiRendererProps) {
  const change = textProp(node.change)
  return (
    <Card size="sm" className="min-w-0 flex-1 gap-1">
      <CardContent className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{textProp(node.label)}</span>
        <span className="truncate text-base font-semibold tabular-nums">{textProp(node.value)}</span>
        {change && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendIcon trend={node.trend} />
            {change}
          </span>
        )}
      </CardContent>
    </Card>
  )
}
