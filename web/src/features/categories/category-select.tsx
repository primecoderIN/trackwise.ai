// A component of the categories feature: the category dropdown (shadcn's Select), enriched with each category's icon
// and tint. Public (index.ts): the expenses feature uses it in its Add dialog, Edit sheet, and filters bar.

import { useTranslations } from "next-intl"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

import { categoryVisual } from "./category-icons"
import { useCategories } from "./queries"

/**
 * The value of the "any category" option (see `anyLabel`). <Select> can't use "" as an option's value, so "any
 * category" needs a value of its own; the filters bar turns it back into "no category filter".
 */
export const ANY_CATEGORY = "all"

interface CategorySelectProps {
  /** The category id as text ("" = nothing chosen yet), because <Select> works with strings. */
  value: string
  /** Called with the chosen option's value: a category id as text, or ANY_CATEGORY. */
  onChange: (value: string) => void
  /** Ties it to a visible <Label htmlFor>. */
  id?: string
  className?: string
  /** For a dropdown with no visible <Label>. */
  ariaLabel?: string
  /** Adds a first option meaning "any category" (value ANY_CATEGORY), e.g. "All categories", already translated. */
  anyLabel?: string
}

/**
 * The category dropdown, wherever a category is picked. Lists categories with their icon badges; shows loading or
 * failure text when unavailable.
 */
export function CategorySelect({ value, onChange, id, className, ariaLabel, anyLabel }: CategorySelectProps) {
  const t = useTranslations("categories")
  const { data: categories = [], isPending, isError } = useCategories()
  const placeholder = isError ? t("select.loadFailed") : isPending ? t("select.loading") : t("select.choose")

  return (
    <Select value={value} onValueChange={onChange} disabled={isError && !anyLabel}>
      <SelectTrigger id={id} className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {anyLabel && <SelectItem value={ANY_CATEGORY}>{anyLabel}</SelectItem>}
        {categories.map((category) => {
          const visual = categoryVisual(category.icon)
          const Icon = visual.icon
          return (
            <SelectItem key={category.id} value={String(category.id)}>
              <span className={`inline-flex size-5 items-center justify-center rounded ${visual.tileClass}`}>
                <Icon className="size-3" aria-hidden="true" />
              </span>
              <span>{category.name}</span>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
