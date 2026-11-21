// The categories feature's API calls and their types: the only file in this feature that talks to the backend. The
// types come from the generated contract; the calls go through the shared typed client. Used by queries.ts.

import { api, unwrap, type Schemas } from "@/shared/api/http"

/** One category as the API sends it: its id, its name ("Food", "Travel"...) and its icon name. */
export type Category = Schemas["CategoryRead"]
/** One month's spending totals and per-category breakdown, used by the Categories page. */
export type MonthlyCategorySummary = Schemas["MonthlySummary"]

/** Every category. `signal` lets TanStack Query cancel the request. Throws ApiError if it fails. */
export function listCategories(signal?: AbortSignal): Promise<Category[]> {
  return unwrap(api.GET("/api/v1/categories", { signal }))
}

/** One month's spending totals by category (`month` as "YYYY-MM"). Throws ApiError if it fails. */
export function getCategoryMonthlySummary(month: string, signal?: AbortSignal): Promise<MonthlyCategorySummary> {
  return unwrap(api.GET("/api/v1/summary", { params: { query: { month } }, signal }))
}
