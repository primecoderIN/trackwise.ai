// The Dashboard's route: "/dashboard" (moved from "/" in Phase 29 so "/" serves the public landing page). Part of the
// app composition (app/). A server component for its metadata (privatePage: signed-in pages aren't indexed); the page
// itself is the dashboard feature's, drawn in the browser.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { DashboardPage } from "@/app/_views/client-pages"

/** The tab's title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.dashboard"))
}

/** The Dashboard page. */
export default function Dashboard() {
  return <DashboardPage />
}
