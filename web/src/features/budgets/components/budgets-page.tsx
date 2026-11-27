// A component of the budgets feature: the Budgets page, the feature's main export (its route file,
// app/(client)/(app)/budgets/page.tsx, draws it through the lazy BudgetsPage in index.ts). Uses the shared MonthPicker.

import { useTranslations } from "next-intl"
import { useState } from "react"

import { DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
import { MonthPicker } from "@/shared/components/month-picker"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { currentMonth } from "@/shared/lib/format"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Skeleton } from "@/shared/ui/skeleton"

import { useBudgetStatus } from "../queries"
import { CategoryBudgets } from "./category-budgets"
import { OverallCard } from "./overall-card"

/**
 * The Budgets page. Until the status has loaded it shows a skeleton, or an error card with Try again; once loaded, a
 * failed reload keeps the figures on screen with a "couldn't refresh" notice.
 */
export function BudgetsPage() {
  const t = useTranslations("budgets")
  const messageOf = useMessageOf()
  const [month, setMonth] = useState(currentMonth)
  const status = useBudgetStatus(month)
  const retry = () => void status.refetch()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("page.title")}
        description={t("page.description", { currency: status.data?.currency ?? DEFAULT_CURRENCY })}
        actions={<MonthPicker month={month} onChange={setMonth} />}
      />
      {status.data ? (
        <>
          {status.isError && (
            <RefreshNotice message={messageOf(status.error)} onRetry={retry} retrying={status.isFetching} />
          )}
          <OverallCard status={status.data} />
          <CategoryBudgets status={status.data} />
        </>
      ) : status.isError ? (
        <SectionError
          title={t("page.loadFailed")}
          message={messageOf(status.error)}
          onRetry={retry}
          retrying={status.isFetching}
        />
      ) : (
        <div className="grid gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      )}
    </div>
  )
}
