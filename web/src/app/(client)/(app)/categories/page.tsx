// The Categories page's route: "/categories" (Phase 28). Part of the app composition (app/). A server component for its
// metadata (privatePage); the page itself is the categories feature's, drawn in the browser.

import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { privatePage } from "@/app/_seo/seo"
import { CategoriesPage } from "@/app/_views/client-pages"

/** The tab's title in the active language, kept out of search engines. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("app")
  return privatePage(t("pages.categories"))
}

/** The Categories page. */
export default function Categories() {
  return <CategoriesPage />
}
