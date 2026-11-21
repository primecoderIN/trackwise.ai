// The Reports page's route: "/reports" (Phase 28). Part of the app composition (app/). A server component for its
// metadata (privatePage); the page itself is the reports feature's, drawn in the browser.

import type { Metadata } from "next"

import en from "@/app/_i18n/en"
import { privatePage } from "@/app/_seo/seo"
import { ReportsPage } from "@/app/_views/client-pages"

/** The tab's title, and kept out of search engines. */
export const metadata: Metadata = privatePage(en.pages.reports)

/** The Reports page. */
export default function Reports() {
  return <ReportsPage />
}
