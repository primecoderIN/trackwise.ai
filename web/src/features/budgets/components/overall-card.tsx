// A component of the budgets feature: the overall budget's card at the top of the Budgets page: the month's total
// against the overall limit, with today's pace mark and legend on the bar. Used by the Budgets page.

import { Card } from "@primecoderin/fast-ui-react"
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"

import type { BudgetStatus } from "../api"
import { BudgetDialog } from "./budget-dialog"
import { BudgetFigures } from "./budget-figures"
import { BudgetStateBadge } from "./budget-state-badge"

/** The overall line: its state badge, the pace meter with legend, and the limit dialog. */
export function OverallCard({ status }: { status: BudgetStatus }) {
  const t = useTranslations("budgets")
  const { formatMonth } = useFormatters()
  const { overall } = status
  const name = t("dialog.overallName")
  const elapsed =
    Number(status.month_elapsed_percent) > 0 && Number(status.month_elapsed_percent) < 100
      ? status.month_elapsed_percent
      : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{t("overall.title")}</span>
          {overall.state && <BudgetStateBadge state={overall.state} />}
        </CardTitle>
        <CardDescription>{t("overall.description", { month: formatMonth(status.month) })}</CardDescription>
        <CardAction>
          <BudgetDialog scope={null} name={name} currency={status.currency} currentLimit={overall.limit ?? null} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2">
        <BudgetFigures
          line={overall}
          currency={status.currency}
          name={name}
          elapsedPercent={elapsed}
          showElapsedLegend
        />
        {overall.limit == null && <p className="text-sm text-muted-foreground">{t("overall.noLimit")}</p>}
      </CardContent>
    </Card>
  )
}
