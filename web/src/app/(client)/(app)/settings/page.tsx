// The Settings page's route: "/settings". Part of the app composition (app/). A server component for its metadata
// (privatePage); the page itself is the account feature's (the person's profile, sessions and access tokens), drawn in
// the browser, behind the session check like every route in this group.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { MessageScope } from "@/app/_shell/message-scope"
import { SettingsPage } from "@/app/_views/client-pages"

/** The tab's title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.settings"))
}

/** The Settings page. */
export default function Settings() {
  return (
    <MessageScope namespaces={["account"]}>
      <SettingsPage />
    </MessageScope>
  )
}
