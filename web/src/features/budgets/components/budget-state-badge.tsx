// A component of the budgets feature: a semantic status badge naming a budget's state ("On track", "Near the limit",
// "Over the limit"). Used by the overall card, category rows, and Dashboard's budget summary.

import { useTranslations } from "next-intl"

import { BUDGETS } from "@/shared/api/contracts.gen"
import { pick } from "@/shared/lib/guards"
import { Badge } from "@/shared/ui/badge"

import type { BudgetState } from "../api"

const STATE_VARIANTS: Readonly<Record<BudgetState, "positive" | "warning" | "destructive">> = {
  [BUDGETS.states.on_track]: "positive",
  [BUDGETS.states.near_limit]: "warning",
  [BUDGETS.states.over_limit]: "destructive",
}

/** The state's name, in a semantic badge styled with positive / warning / destructive tokens. */
export function BudgetStateBadge({ state }: { state: BudgetState }) {
  const t = useTranslations("budgets")
  return <Badge variant={pick(STATE_VARIANTS, state)}>{t(`states.${state}`)}</Badge>
}
