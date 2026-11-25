// The categories feature's public API: other features import ONLY from "@/features/categories".
// Every other file in this folder is private, so it can change freely as long as these stay the same.
// - Category: one category's type.
// - CategorySelect, ANY_CATEGORY: the category dropdown and its "any category" value.
// - categoryKeys, useCategories, useCategoryName: the cache keys, list hook, and id -> name lookup.

import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

export type { Category } from "./api"
export { ANY_CATEGORY, CategorySelect } from "./category-select"
export { categoryKeys, useCategories, useCategoryName } from "./queries"

/**
 * The Categories page, loaded on first use (`categories` messages come from next-intl's route provider).
 */
export const CategoriesPage = lazyWithRetry(async () => {
  const { CategoriesPage: page } = await import("./components/categories-page")
  return { default: page }
})
