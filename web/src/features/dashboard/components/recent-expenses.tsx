// A component of the dashboard feature: the "Recent expenses" card with colour-coded category icons, payment method
// tags, clean row hover states, and direct link to Expenses. Used by the Dashboard page.

import { ArrowUpRight, ReceiptText } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { categoryVisual, useCategoryLookup, useCategoryName } from "@/features/categories"
import type { Expense } from "@/features/expenses"
import { PAYMENT_METHOD_LABELS } from "@/shared/api/contracts.gen"
import { EmptyState } from "@/shared/components/empty-state"
import { ExpenseMoney } from "@/shared/components/money"
import { ROUTES } from "@/shared/config/routes"
import { useLanguage } from "@/shared/i18n"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

/**
 * "Recent expenses": the newest few expenses with category icon tiles, payment method pills, formatted dates and
 * amounts, and a "View all" action.
 */
export function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  const t = useTranslations("dashboard")
  const { language } = useLanguage()
  const { formatDate } = useFormatters()
  const categoryName = useCategoryName()
  const categoryOf = useCategoryLookup()
  const paymentLabels = PAYMENT_METHOD_LABELS[language]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("recent.title")}</CardTitle>
        <CardDescription>{t("recent.latest", { count: expenses.length })}</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild className="gap-1">
            <Link href={ROUTES.expenses}>
              <span>{t("recent.viewAll")}</span>
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            message={t("recent.empty")}
            action={{ label: t("addExpense"), to: `${ROUTES.expenses}?add=1`, primary: true }}
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {expenses.map((expense) => {
              const visual = categoryVisual(categoryOf(expense.category_id)?.icon)
              const Icon = visual.icon
              return (
                <li
                  key={expense.id}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-muted/45"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${visual.tileClass}`}>
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{expense.merchant}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>
                          {t("recent.categoryAndDate", {
                            category: categoryName(expense.category_id),
                            date: formatDate(expense.spent_on),
                          })}
                        </span>
                        <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px] font-medium">
                          {paymentLabels[expense.payment_method]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold text-foreground tabular-nums">
                    <ExpenseMoney
                      amount={expense.amount}
                      currency={expense.currency}
                      baseAmount={expense.base_amount}
                      rate={expense.exchange_rate}
                      rateDate={expense.rate_date}
                    />
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
