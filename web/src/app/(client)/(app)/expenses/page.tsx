// The Expenses page's route: "/expenses". Part of the app composition (app/). A server component for its metadata
// (privatePage: signed-in pages aren't indexed); the page itself is the expenses feature's, drawn in the browser.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { MessageScope } from "@/app/_shell/message-scope"
import { ExpensesPage } from "@/app/_views/client-pages"

/** The tab's title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.expenses"))
}

/** The Expenses page. */
export default function Expenses() {
  return (
    <MessageScope namespaces={["expenses", "categories"]}>
      <ExpensesPage />
    </MessageScope>
  )
}
