// A component of the dashboard feature: the Budget card: this month's spending against the overall limit, semantic
// status badge, pace legend, and category health note, with a link to Budgets. Loads on its own via useBudgetStatus.

import { Button, Card, SkeletonItem, StatusBadge } from "@primecoderin/fast-ui-react"
import { linkButtonClass } from "@/shared/components/link-button"
import { CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { BudgetMeter, BudgetStateBadge, useBudgetStatus, type BudgetStatus } from "@/features/budgets"
import { BUDGETS } from "@/shared/api/contracts.gen"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { ROUTES } from "@/shared/config/routes"
import { currentMonth } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

/** The card: a skeleton while loading, a short note with retry if it failed, otherwise the budget pace summary. */
export function BudgetCard({ month = currentMonth() }: { month?: string }) {
  const t = useTranslations("dashboard")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const status = useBudgetStatus(month)
  const retry = () => void status.refetch()
  const overallState = status.data?.overall.state

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="flex flex-wrap items-center gap-2">
          <span>{t("budget.title")}</span>
          {overallState && <BudgetStateBadge state={overallState} />}
        </CardTitle>
        <CardDescription>{t("budget.description")}</CardDescription>
        <CardAction>
          <Link
            className={linkButtonClass({ variant: "secondary", size: "small", className: "gap-1" })}
            href={ROUTES.budgets}
          >
            <span>{t("budget.open")}</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {status.isError && status.data && (
          <RefreshNotice message={messageOf(status.error)} onRetry={retry} retrying={status.isFetching} />
        )}
        {status.data ? (
          <BudgetSummary status={status.data} />
        ) : status.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-muted-foreground">{t("budget.loadFailed")}</p>
            <Button variant="secondary" size="small" onClick={retry} disabled={status.isFetching}>
              {tCommon(status.isFetching ? "retry.tryingAgain" : "retry.retry")}
            </Button>
          </div>
        ) : (
          <SkeletonItem className="h-12 rounded-xl" />
        )}
      </CardContent>
    </Card>
  )
}

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
  const elapsedLabel = elapsed ? t("budget.today", { percent: elapsed }) : undefined

  return (
    <>
      {overall.limit != null && overall.used_percent != null && overall.state != null ? (
        <div className="grid gap-2">
          <BudgetMeter
            usedPercent={overall.used_percent}
            state={overall.state}
            label={t("budget.meter", { percent: overall.used_percent })}
            elapsedPercent={elapsed}
            elapsedLabel={elapsedLabel}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-foreground tabular-nums">
              {t("budget.spentOf", { spent: money(overall.spent), limit: money(overall.limit) })}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {elapsedLabel && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
                  <span className="inline-block h-3 w-0.5 rounded-full bg-foreground/75" aria-hidden="true" />
                  <span>{elapsedLabel}</span>
                </span>
              )}
              {budgeted.length > 0 && (
                <StatusBadge tone={attention > 0 ? "warning" : "success"}>
                  {attention > 0 ? t("budget.attention", { count: attention }) : t("budget.allOnTrack")}
                </StatusBadge>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground">{t("budget.noLimit")}</p>
          {budgeted.length > 0 && (
            <StatusBadge tone={attention > 0 ? "warning" : "success"}>
              {attention > 0 ? t("budget.attention", { count: attention }) : t("budget.allOnTrack")}
            </StatusBadge>
          )}
        </div>
      )}
    </>
  )
}
