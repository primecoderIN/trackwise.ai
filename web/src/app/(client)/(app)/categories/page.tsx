// The Categories page's route: "/categories" (Phase 28). Part of the app composition (app/). A server component for its
// metadata (privatePage); the page itself is the categories feature's, drawn in the browser.

import type { Metadata } from "next"

import en from "@/app/_i18n/en"
import { privatePage } from "@/app/_seo/seo"
import { CategoriesPage } from "@/app/_views/client-pages"

/** The tab's title, and kept out of search engines. */
export const metadata: Metadata = privatePage(en.pages.categories)

/** The Categories page. */
export default function Categories() {
  return <CategoriesPage />
}
