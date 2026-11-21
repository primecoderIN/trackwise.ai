// The reports feature's server state, through TanStack Query: the cache keys and the monthly report hook.
// `reportKeys` is public (index.ts), so the app's refresh rule (app/_shell/query-client.ts) can invalidate reports
// whenever expenses change.

import { useQuery } from "@tanstack/react-query"

import { getMonthlyReport } from "./api"

/** TanStack Query keys for the reports feature, all filed under ["reports", ...]. */
export const reportKeys = {
  all: ["reports"] as const,
  monthly: (month: string) => ["reports", "monthly", month] as const,
}

/** The report figures for `month` ("YYYY-MM"), cached per month. */
export function useMonthlyReport(month: string) {
  return useQuery({
    queryKey: reportKeys.monthly(month),
    queryFn: ({ signal }) => getMonthlyReport(month, signal),
  })
}
