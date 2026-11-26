// Shared-group invite link route: "/splits/join/[token]". Behind AuthGate so unauthenticated visitors sign in and
// return here automatically via return_to.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { MessageScope } from "@/app/_shell/message-scope"
import { SplitJoinPage } from "@/app/_views/client-pages"

/** Tab title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.splits"))
}

/** Invite acceptance screen for a Shared group token. */
export default async function SplitJoin({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <MessageScope namespaces={["splits"]}>
      <SplitJoinPage token={decodeURIComponent(token)} />
    </MessageScope>
  )
}
