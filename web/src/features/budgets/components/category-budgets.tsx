// A component of the budgets feature: the "By category" card: budgeted categories shown prominently with icons and
// pace meters, followed by unbudgeted categories in a calmer section below. Used by the Budgets page.

import { Card } from "@primecoderin/fast-ui-react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { PiggyBank } from "lucide-react"
import { useTranslations } from "next-intl"

import { categoryVisual, useCategoryLookup } from "@/features/categories"
import { EmptyState } from "@/shared/components/empty-state"

import type { BudgetStatus, CategoryBudgetLine } from "../api"
import { BudgetDialog } from "./budget-dialog"
import { BudgetFigures } from "./budget-figures"
import { BudgetStateBadge } from "./budget-state-badge"

/** Every category, visually separating budgeted categories (with pace bars) from unbudgeted ones. */
export function CategoryBudgets({ status }: { status: BudgetStatus }) {
  const t = useTranslations("budgets")
  const categoryOf = useCategoryLookup()
  const elapsed =
    Number(status.month_elapsed_percent) > 0 && Number(status.month_elapsed_percent) < 100
      ? status.month_elapsed_percent
      : undefined

  const budgeted = status.categories.filter((line) => line.limit != null)
  const unbudgeted = status.categories.filter((line) => line.limit == null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("categories.title")}</CardTitle>
        <CardDescription>{t("categories.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {status.categories.length === 0 ? (
          <EmptyState icon={PiggyBank} message={t("categories.empty")} />
        ) : (
          <div className="flex flex-col gap-6">
            {budgeted.length > 0 && (
              <ul className="divide-y">
                {budgeted.map((line) => (
                  <CategoryRow
                    key={line.category_id}
                    line={line}
                    iconName={categoryOf(line.category_id)?.icon}
                    currency={status.currency}
                    elapsedPercent={elapsed}
                  />
                ))}
              </ul>
            )}

            {unbudgeted.length > 0 && (
              <div className="flex flex-col gap-2">
                {budgeted.length > 0 && (
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {t("categories.unbudgetedHeading")}
                  </p>
                )}
                <ul className="divide-y rounded-xl border border-border/70 bg-muted/20 px-3 sm:px-4">
                  {unbudgeted.map((line) => (
                    <CategoryRow
                      key={line.category_id}
                      line={line}
                      iconName={categoryOf(line.category_id)?.icon}
                      currency={status.currency}
                    />
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryRow({
  line,
  iconName,
  currency,
  elapsedPercent,
}: {
  line: CategoryBudgetLine
  iconName: string | undefined
  currency: string
  elapsedPercent?: string
}) {
  const visual = categoryVisual(iconName)
  const Icon = visual.icon
  return (
    <li className="grid gap-2.5 py-3.5 first:pt-2 last:pb-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${visual.tileClass}`}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-medium text-foreground">{line.category_name}</span>
            {line.state && <BudgetStateBadge state={line.state} />}
          </div>
        </div>
        <BudgetDialog
          scope={line.category_id}
          name={line.category_name}
          currency={currency}
          currentLimit={line.limit ?? null}
        />
      </div>
      <BudgetFigures line={line} currency={currency} name={line.category_name} elapsedPercent={elapsedPercent} />
    </li>
  )
}
