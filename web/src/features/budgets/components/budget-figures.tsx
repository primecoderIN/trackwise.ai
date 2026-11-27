// A component of the budgets feature: one budget's numbers: the bar, "$420 of $500", what's left (or how much over),
// and an optional inline pace legend explaining the vertical day-of-month tick. Used by OverallCard and CategoryBudgets.

import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"

import type { BudgetLine } from "../api"
import { BudgetMeter } from "./budget-meter"

const MINUS = "-"

interface BudgetFiguresProps {
  line: BudgetLine
  currency: string
  /** What the budget is for, for the bar's screen-reader label. */
  name: string
  /** How much of the month has gone by (percent), to mark on the bar. */
  elapsedPercent?: string
  /** Show the small tick legend underneath (used on the Overall card). */
  showElapsedLegend?: boolean
}

/** The bar and figures under it, or "$300 spent · No limit" for a line without a budget. */
export function BudgetFigures({ line, currency, name, elapsedPercent, showElapsedLegend = false }: BudgetFiguresProps) {
  const t = useTranslations("budgets")
  const { formatMoney } = useFormatters()
  const spent = formatMoney(line.spent, currency)
  if (line.limit == null || line.remaining == null || line.used_percent == null || line.state == null) {
    return <p className="text-sm text-muted-foreground tabular-nums">{t("line.spentNoLimit", { amount: spent })}</p>
  }
  const over = line.remaining.startsWith(MINUS)
  const rest = formatMoney(over ? line.remaining.slice(MINUS.length) : line.remaining, currency)
  const elapsedLabel = elapsedPercent ? t("line.today", { percent: elapsedPercent }) : undefined

  return (
    <div className="grid gap-2">
      <BudgetMeter
        usedPercent={line.used_percent}
        state={line.state}
        label={t("line.meter", { name, percent: line.used_percent })}
        elapsedPercent={elapsedPercent}
        elapsedLabel={elapsedLabel}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm tabular-nums">
        <span className="font-medium text-foreground">
          {t("line.spentOf", { spent, limit: formatMoney(line.limit, currency) })}
        </span>
        <span className={over ? "font-medium text-destructive" : "text-muted-foreground"}>
          {t(over ? "line.over" : "line.left", { amount: rest })}
        </span>
      </div>
      {showElapsedLegend && elapsedLabel && (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
          <span className="inline-block h-3 w-0.5 rounded-full bg-foreground/75" aria-hidden="true" />
          <span>{elapsedLabel}</span>
        </p>
      )}
    </div>
  )
}
