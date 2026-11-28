// A component of the categories feature: the category dropdown (the design system's SelectField), listing every
// category by name. Public (index.ts): the expenses feature uses it in its Add dialog, Edit sheet, and filters bar.

import { SelectField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"

import { useCategories } from "./queries"

/**
 * The value of the "any category" option (see `anyLabel`). A select can't use "" as an option's value (that means
 * "nothing chosen"), so "any category" needs a value of its own; the filters bar turns it back into "no filter".
 */
export const ANY_CATEGORY = "all"

interface CategorySelectProps {
  /** The category id as text (“” = nothing chosen yet), because selects work with strings. */
  value: string
  /** Called with the chosen option's value: a category id as text, or ANY_CATEGORY. */
  onChange: (value: string) => void
  /** Kept for callers that tie the control to a label; the field names itself from `label` or `ariaLabel`. */
  id?: string
  className?: string
  /** The visible label above the dropdown. Without it the label is only for assistive technology. */
  label?: string
  /** For a dropdown with no visible label. */
  ariaLabel?: string
  /** Adds a first option meaning "any category" (value ANY_CATEGORY), e.g. "All categories", already translated. */
  anyLabel?: string
}

/**
 * The category dropdown, wherever a category is picked. Lists categories by name; shows loading or failure text
 * when unavailable.
 */
export function CategorySelect({ value, onChange, className, label, ariaLabel, anyLabel }: CategorySelectProps) {
  const t = useTranslations("categories")
  const { data: categories = [], isPending, isError } = useCategories()
  const placeholder = isError ? t("select.loadFailed") : isPending ? t("select.loading") : t("select.choose")

  const options = useMemo<SelectOption[]>(
    () => [
      ...(anyLabel ? [{ value: ANY_CATEGORY, label: anyLabel }] : []),
      ...categories.map((category) => ({ value: String(category.id), label: category.name })),
    ],
    [anyLabel, categories],
  )

  return (
    <div className={className}>
      <SelectField
        label={label ?? ariaLabel ?? placeholder}
        hideLabel={label === undefined}
        options={options}
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        disabled={isError && !anyLabel}
        size="small"
      />
    </div>
  )
}
