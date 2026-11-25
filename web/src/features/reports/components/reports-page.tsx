// The Reports page (/reports): pick a month, inspect totals against the previous month, see the category and payment
// method breakdowns and biggest expenses, and download the report in every format the API offers (CSV and Markdown,
// D209). Part of the reports feature (Phase 28).

import { ChevronLeft, ChevronRight, Download, FileBarChart } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { toast } from "sonner"

import { DEFAULT_CURRENCY, REPORT_FORMATS } from "@/shared/api/contracts.gen"
import { EmptyState } from "@/shared/components/empty-state"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { ROUTES } from "@/shared/config/routes"
import { currentMonth, MAX_MONTH, MIN_MONTH, shiftMonth } from "@/shared/lib/format"
import { saveFile } from "@/shared/lib/save-file"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

import { fetchMonthlyReportFile, type ReportFormat } from "../api"
import { useMonthlyReport } from "../queries"
import { ReportBreakdowns, ReportStatCards } from "./report-sections"

/** The Reports page: monthly summary, comparison with last month, breakdowns and file downloads. */
export function ReportsPage() {
  const t = useTranslations("reports")
  const messageOf = useMessageOf()
  const { formatMonth } = useFormatters()
  const [month, setMonth] = useState(currentMonth)
  const [downloading, setDownloading] = useState<ReportFormat | null>(null)
  const report = useMonthlyReport(month)
  const retry = () => void report.refetch()
  const step = (offset: number) => () => setMonth((current) => shiftMonth(current, offset))

  async function handleDownload(format: ReportFormat) {
    if (downloading) return
    setDownloading(format)
    try {
      const file = await fetchMonthlyReportFile(month, format)
      saveFile(file.blob, file.name ?? `trackwise-${month}.${format}`)
    } catch (error) {
      toast.error(messageOf(error))
    } finally {
      setDownloading(null)
    }
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("page.previousMonth")}
          onClick={step(-1)}
          disabled={month <= MIN_MONTH}
        >
          <ChevronLeft />
        </Button>
        <span aria-live="polite" className="min-w-32 text-center text-sm font-medium">
          {formatMonth(month)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("page.nextMonth")}
          onClick={step(1)}
          disabled={month >= MAX_MONTH}
        >
          <ChevronRight />
        </Button>
      </div>
      {REPORT_FORMATS.map((format) => (
        <Button
          key={format}
          variant="outline"
          size="sm"
          disabled={downloading !== null || !report.data || report.data.expense_count === 0}
          onClick={() => void handleDownload(format)}
        >
          <Download className="size-4" />
          {downloading === format ? t("downloads.downloading") : t(`downloads.${format}`)}
        </Button>
      ))}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("page.title")}
        description={t("page.description", { currency: report.data?.currency ?? DEFAULT_CURRENCY })}
        actions={actions}
      />
      {report.data ? (
        <>
          {report.isError && (
            <RefreshNotice message={messageOf(report.error)} onRetry={retry} retrying={report.isFetching} />
          )}
          <ReportStatCards report={report.data} />
          {report.data.expense_count === 0 ? (
            <Card>
              <CardContent className="p-6">
                <EmptyState
                  icon={FileBarChart}
                  title={t("empty.title", { month: formatMonth(report.data.month) })}
                  message={t("empty.description")}
                  action={{ label: t("empty.addExpense"), to: ROUTES.expenses }}
                />
              </CardContent>
            </Card>
          ) : (
            <ReportBreakdowns report={report.data} />
          )}
        </>
      ) : report.isError ? (
        <SectionError
          title={t("page.loadFailed")}
          message={messageOf(report.error)}
          onRetry={retry}
          retrying={report.isFetching}
        />
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64" />
        </div>
      )}
    </div>
  )
}
