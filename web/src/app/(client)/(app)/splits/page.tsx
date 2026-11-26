// The Splits page's route: "/splits". Server component exporting privatePage metadata and scoping next-intl namespaces.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { MessageScope } from "@/app/_shell/message-scope"
import { SplitsPage } from "@/app/_views/client-pages"

/** Tab title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.splits"))
}

/** The Splits workspace page. */
export default function Splits() {
  return (
    <MessageScope namespaces={["splits", "categories"]}>
      <SplitsPage />
    </MessageScope>
  )
}
