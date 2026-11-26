// Equal vs. Exact participant share picker sub-component used inside SplitDialog (keeps SplitDialog concise).

import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { formatMinorToMajor, parseMajorToMinor, previewEqualShares } from "../../split-preview"

/** One selectable participant in a direct or group split. */
export interface ParticipantOption {
  key: string
  label: string
}

/** Props for the Equal / Exact participant share selector. */
export interface SplitParticipantsFieldProps {
  options: readonly ParticipantOption[]
  selectedKeys: readonly string[]
  method: "equal" | "exact"
  totalMinor: number | null
  currency: string
  exactValues: Readonly<Record<string, string>>
  disabled?: boolean
  onToggle: (key: string) => void
  onExactChange: (key: string, value: string) => void
}

/** Renders participant checkboxes with live minor-unit Equal previews or Exact custom-amount inputs. */
export function SplitParticipantsField({
  options,
  selectedKeys,
  method,
  totalMinor,
  currency,
  exactValues,
  disabled = false,
  onToggle,
  onExactChange,
}: SplitParticipantsFieldProps) {
  const t = useTranslations("splits")
  const { formatMoney } = useFormatters()

  const equalMap = totalMinor !== null && method === "equal" ? previewEqualShares(totalMinor, selectedKeys) : {}

  let exactAssignedMinor = 0
  let exactAllValid = selectedKeys.length > 0
  if (method === "exact") {
    for (const key of selectedKeys) {
      const parsed = parseMajorToMinor(exactValues[key] ?? "0", currency)
      if (parsed === null) {
        exactAllValid = false
      } else {
        exactAssignedMinor += parsed
      }
    }
  }
  const diffMinor = totalMinor !== null && exactAllValid ? totalMinor - exactAssignedMinor : null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{t("dialogs.split.participantsLabel")}</Label>
        {method === "exact" && diffMinor !== null && (
          <span
            className={`text-xs font-medium ${
              diffMinor === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {diffMinor === 0
              ? t("dialogs.split.exactMatched")
              : diffMinor > 0
                ? t("dialogs.split.exactRemaining", {
                    amount: formatMoney(formatMinorToMajor(diffMinor, currency), currency),
                  })
                : t("dialogs.split.exactOver", {
                    amount: formatMoney(formatMinorToMajor(-diffMinor, currency), currency),
                  })}
          </span>
        )}
      </div>
      <div className="flex max-h-44 flex-col gap-2 overflow-y-auto rounded-md border p-2.5">
        {options.map((opt) => {
          const checked = selectedKeys.includes(opt.key)
          const equalMinor = equalMap[opt.key]
          return (
            <div key={opt.key} className="flex items-center justify-between gap-2">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={checked} disabled={disabled} onCheckedChange={() => onToggle(opt.key)} />
                <span className="truncate">{opt.label}</span>
              </label>
              {checked && method === "equal" && equalMinor !== undefined && (
                <span className="text-xs font-medium text-muted-foreground">
                  {formatMoney(formatMinorToMajor(equalMinor, currency), currency)}
                </span>
              )}
              {checked && method === "exact" && (
                <Input
                  type="text"
                  inputMode="decimal"
                  aria-label={`${opt.label} ${t("dialogs.split.exact")}`}
                  disabled={disabled}
                  className="h-8 w-28 text-right text-sm"
                  placeholder="0.00"
                  value={exactValues[opt.key] ?? ""}
                  onChange={(e) => onExactChange(opt.key, e.target.value)}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
