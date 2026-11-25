// The Reports page's route: "/reports" (Phase 28). Part of the app composition (app/). A server component for its
// metadata (privatePage); the page itself is the reports feature's, drawn in the browser.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { MessageScope } from "@/app/_shell/message-scope"
import { ReportsPage } from "@/app/_views/client-pages"

/** The tab's title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.reports"))
}

/** The Reports page. */
export default function Reports() {
  return (
    <MessageScope namespaces={["reports"]}>
      <ReportsPage />
    </MessageScope>
  )
}
