// A component of the dashboard feature: the Budget card: this month's spending against the overall limit, and how
// many categories need attention, with a link to the Budgets page. It loads the budgets' status on its own (the
// budgets feature's useBudgetStatus), so the rest of the Dashboard never waits for it. Used by the Dashboard page.

import Link from "next/link"
import { useTranslations } from "next-intl"

import { BudgetMeter, useBudgetStatus, type BudgetStatus } from "@/features/budgets"
import { BUDGETS } from "@/shared/api/contracts.gen"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { ROUTES } from "@/shared/config/routes"
import { currentMonth } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

/** The card: a skeleton while loading, a short note with retry if it failed, otherwise the summary. */
export function BudgetCard({ month = currentMonth() }: { month?: string }) {
  const t = useTranslations("dashboard")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const status = useBudgetStatus(month)
  const retry = () => void status.refetch()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("budget.title")}</CardTitle>
        <CardDescription>{t("budget.description")}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href={ROUTES.budgets}>{t("budget.open")}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {status.isError && status.data && (
          <RefreshNotice message={messageOf(status.error)} onRetry={retry} retrying={status.isFetching} />
        )}
        {status.data ? (
          <BudgetSummary status={status.data} />
        ) : status.isError ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground">{t("budget.loadFailed")}</p>
            <Button variant="outline" size="sm" onClick={retry} disabled={status.isFetching}>
              {tCommon(status.isFetching ? "retry.tryingAgain" : "retry.retry")}
            </Button>
          </div>
        ) : (
          <Skeleton className="h-10" />
        )}
      </CardContent>
    </Card>
  )
}

/** The overall bar and figures (or "No overall limit yet"), then how many categories are near or over. */
function BudgetSummary({ status }: { status: BudgetStatus }) {
  const t = useTranslations("dashboard")
  const { formatMoney } = useFormatters()
  const { overall, currency } = status
  const money = (amount: string) => formatMoney(amount, currency)
  const budgeted = status.categories.filter((line) => line.state != null)
  const attention = budgeted.filter((line) => line.state !== BUDGETS.states.on_track).length
  const elapsed =
    Number(status.month_elapsed_percent) > 0 && Number(status.month_elapsed_percent) < 100
      ? status.month_elapsed_percent
      : undefined
  return (
    <>
      {overall.limit != null && overall.used_percent != null && overall.state != null ? (
        <>
          <BudgetMeter
            usedPercent={overall.used_percent}
            state={overall.state}
            label={t("budget.meter", { percent: overall.used_percent })}
            elapsedPercent={elapsed}
            elapsedLabel={elapsed ? t("budget.today", { percent: elapsed }) : undefined}
          />
          <p className="tabular-nums">
            {t("budget.spentOf", { spent: money(overall.spent), limit: money(overall.limit) })}
          </p>
        </>
      ) : (
        <p className="text-muted-foreground">{t("budget.noLimit")}</p>
      )}
      {budgeted.length > 0 && (
        <p className={attention > 0 ? "text-destructive" : "text-muted-foreground"}>
          {attention > 0 ? t("budget.attention", { count: attention }) : t("budget.allOnTrack")}
        </p>
      )}
    </>
  )
}
