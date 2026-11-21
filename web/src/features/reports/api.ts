// The reports feature's API calls and their types: the monthly report figures and the file downloads (CSV and
// Markdown). The types come from the generated contract; the calls go through the shared typed client (D209). Used by
// queries.ts and the download buttons.

import { api, unwrap, unwrapFile, type DownloadedFile, type Schemas } from "@/shared/api/http"

/** A month's report: totals, comparison with last month, daily average, category/payment breakdowns and top expenses. */
export type MonthlyReport = Schemas["MonthlyReport"]
/** One category's share of a month's report. */
export type CategoryShare = Schemas["CategoryShare"]
/** One payment method's share of a month's report. */
export type PaymentShare = Schemas["PaymentShare"]
/** One of a month's biggest expenses. */
export type BigExpense = Schemas["BigExpense"]
/** A download format ("csv" | "md"). */
export type ReportFormat = Schemas["ReportFormat"]

/** The report figures for `month` ("YYYY-MM"). `signal` lets TanStack Query cancel it. Throws ApiError if it fails. */
export function getMonthlyReport(month: string, signal?: AbortSignal): Promise<MonthlyReport> {
  return unwrap(api.GET("/api/v1/reports/monthly/{month}", { params: { path: { month } }, signal }))
}

/** Downloads `month`'s report in `format` ("csv" or "md") as a blob with the server's file name. */
export function fetchMonthlyReportFile(month: string, format: ReportFormat): Promise<DownloadedFile> {
  return unwrapFile(
    api.GET("/api/v1/reports/monthly/{month}/{format}", {
      params: { path: { month, format } },
      parseAs: "blob",
    }),
  )
}
