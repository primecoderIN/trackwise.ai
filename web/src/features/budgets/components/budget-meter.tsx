// A component of the budgets feature: a smooth progress meter showing how much of a budget is used, coloured with
// semantic tokens (positive, warning, destructive), plus an optional elapsed-month pace marker. Public (index.ts).

import { BUDGETS } from "@/shared/api/contracts.gen"
import { pick } from "@/shared/lib/guards"
import { cn } from "@/shared/lib/utils"

import type { BudgetState } from "../api"

const STATE_COLOURS: Readonly<Record<BudgetState, string>> = {
  [BUDGETS.states.on_track]: "bg-positive",
  [BUDGETS.states.near_limit]: "bg-warning",
  [BUDGETS.states.over_limit]: "bg-destructive",
}

/** A percentage from the API ("84.0") as a number between 0 and 100, for a width or a position. */
function clampedPercent(value: string): number {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(Math.max(number, 0), BUDGETS.fullPercent) : 0
}

interface BudgetMeterProps {
  /** The share of the limit used, in percent ("84.0"); above 100 when over. The bar stops at full. */
  usedPercent: string
  state: BudgetState
  /** What screen readers announce, e.g. "Food: 84% of the limit used". */
  label: string
  /** How much of the month has gone by, in percent: drawn as a crisp tick mark on the bar. */
  elapsedPercent?: string
  /** The mark's tooltip ("Today: 67% of the month"). */
  elapsedLabel?: string
  className?: string
}

/**
 * The bar. Screen readers get a native <progress> (0 to 100) named by `label`; the drawn bar beside it is decoration.
 * Over the limit the bar fills to 100% in destructive red.
 */
export function BudgetMeter({ usedPercent, state, label, elapsedPercent, elapsedLabel, className }: BudgetMeterProps) {
  const width = clampedPercent(usedPercent)
  return (
    <div className={cn("relative h-2.5 w-full rounded-full bg-muted", className)}>
      <progress className="sr-only" value={Math.round(width)} max={BUDGETS.fullPercent} aria-label={label} />
      <div
        aria-hidden
        className={cn("h-full rounded-full transition-all duration-500", pick(STATE_COLOURS, state))}
        style={{ width: `${width}%` }}
      />
      {elapsedPercent !== undefined && (
        <div
          aria-hidden
          title={elapsedLabel}
          className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-foreground/75 ring-2 ring-card"
          style={{ left: `${clampedPercent(elapsedPercent)}%` }}
        />
      )}
    </div>
  )
}
