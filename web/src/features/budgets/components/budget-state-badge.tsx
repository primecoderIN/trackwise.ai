// A component of the budgets feature: a semantic status badge naming a budget's state ("On track", "Near the limit",
// "Over the limit"). Used by the overall card, category rows, and Dashboard's budget summary.

import { StatusBadge, type StatusTone } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"

import { BUDGETS } from "@/shared/api/contracts.gen"
import { pick } from "@/shared/lib/guards"

import type { BudgetState } from "../api"

const STATE_TONES: Readonly<Record<BudgetState, StatusTone>> = {
  [BUDGETS.states.on_track]: "success",
  [BUDGETS.states.near_limit]: "warning",
  [BUDGETS.states.over_limit]: "error",
}

/** The state's name, in a status badge toned success / warning / error. */
export function BudgetStateBadge({ state }: { state: BudgetState }) {
  const t = useTranslations("budgets")
  return <StatusBadge tone={pick(STATE_TONES, state) ?? "neutral"}>{t(`states.${state}`)}</StatusBadge>
}
