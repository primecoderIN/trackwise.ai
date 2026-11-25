// The Budgets page's route: "/budgets". Part of the app composition (app/). A server component for its metadata
// (privatePage); the page itself is the budgets feature's, drawn in the browser.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { MessageScope } from "@/app/_shell/message-scope"
import { BudgetsPage } from "@/app/_views/client-pages"

/** The tab's title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.budgets"))
}

/** The Budgets page. */
export default function Budgets() {
  return (
    <MessageScope namespaces={["budgets"]}>
      <BudgetsPage />
    </MessageScope>
  )
}
