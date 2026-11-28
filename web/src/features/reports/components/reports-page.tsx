// The Reports page (/reports): pick a month with the shared MonthPicker, inspect KPI cards with semantic MoM deltas,
// review colour-coded category and payment breakdowns, and export CSV/Markdown via a clean dropdown. Part of reports.

import { Button, Card, Menu, MenuItem, SkeletonItem } from "@primecoderin/fast-ui-react"
import { CardContent } from "@/shared/components/card-parts"
import { toast } from "@/shared/lib/toast"
import { ChevronDown, Download, FileBarChart, FileSpreadsheet, FileText } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { DEFAULT_CURRENCY, REPORT_FORMATS } from "@/shared/api/contracts.gen"
import { EmptyState } from "@/shared/components/empty-state"
import { MonthPicker } from "@/shared/components/month-picker"
import { PageHeader } from "@/shared/components/page-header"
import { RefreshNotice } from "@/shared/components/refresh-notice"
import { SectionError } from "@/shared/components/section-error"
import { ROUTES } from "@/shared/config/routes"
import { currentMonth } from "@/shared/lib/format"
import { saveFile } from "@/shared/lib/save-file"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import { fetchMonthlyReportFile, type ReportFormat } from "../api"
import { useMonthlyReport } from "../queries"
import { ReportBreakdowns, ReportStatCards } from "./report-sections"

/** The Reports page: monthly summary, comparison with last month, visual breakdowns, and file exports. */
export function ReportsPage() {
  const t = useTranslations("reports")
  const messageOf = useMessageOf()
  const { formatMonth } = useFormatters()
  const [month, setMonth] = useState(currentMonth)
  const [downloading, setDownloading] = useState<ReportFormat | null>(null)
  const report = useMonthlyReport(month)
  const retry = () => void report.refetch()

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

  const canExport = Boolean(report.data && report.data.expense_count > 0 && downloading === null)

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <MonthPicker month={month} onChange={setMonth} />
      <Menu
        align="end"
        trigger={
          <Button variant="secondary" disabled={!canExport} icon={<Download />} iconPosition="before">
            <span>{downloading ? t("downloads.downloading") : t("downloads.export")}</span>
            <ChevronDown className="size-3.5 text-fg-secondary" aria-hidden="true" />
          </Button>
        }
      >
        {REPORT_FORMATS.map((format) => (
          <MenuItem
            key={format}
            icon={
              format === "csv" ? (
                <FileSpreadsheet className="text-positive" aria-hidden="true" />
              ) : (
                <FileText className="text-primary-text" aria-hidden="true" />
              )
            }
            onClick={() => void handleDownload(format)}
          >
            {t(`downloads.${format}`)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
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
                  action={{ label: t("empty.addExpense"), to: `${ROUTES.expenses}?add=1`, primary: true }}
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
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SkeletonItem className="h-32 rounded-2xl" />
            <SkeletonItem className="h-32 rounded-2xl" />
            <SkeletonItem className="h-32 rounded-2xl sm:col-span-2 xl:col-span-1" />
          </div>
          <SkeletonItem className="h-72 rounded-2xl" />
        </div>
      )}
    </div>
  )
}
