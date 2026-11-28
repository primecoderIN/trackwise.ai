// Equal vs. Exact participant share picker sub-component used inside SplitDialog (keeps SplitDialog concise).

import { CheckboxBox, TextField } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"

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
        <span className="text-xs font-semibold text-fg">{t("dialogs.split.participantsLabel")}</span>
        {method === "exact" && diffMinor !== null && (
          <span
            className={`text-xs font-medium ${diffMinor === 0 ? "text-positive-foreground" : "text-warning-foreground"}`}
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
      <div className="flex max-h-44 flex-col gap-2 overflow-y-auto rounded-md border border-line p-2.5">
        {options.map((opt) => {
          const checked = selectedKeys.includes(opt.key)
          const equalMinor = equalMap[opt.key]
          return (
            <div key={opt.key} className="flex items-center justify-between gap-2">
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                <CheckboxBox checked={checked} disabled={disabled} onCheckedChange={() => onToggle(opt.key)} />
                <span className="truncate">{opt.label}</span>
              </label>
              {checked && method === "equal" && equalMinor !== undefined && (
                <span className="text-xs font-medium text-fg-secondary tabular-nums">
                  {formatMoney(formatMinorToMajor(equalMinor, currency), currency)}
                </span>
              )}
              {checked && method === "exact" && (
                <div className="w-28 shrink-0">
                  <TextField
                    label={`${opt.label} ${t("dialogs.split.exact")}`}
                    hideLabel
                    type="text"
                    inputMode="decimal"
                    disabled={disabled}
                    placeholder="0.00"
                    value={exactValues[opt.key] ?? ""}
                    onValueChange={(value) => onExactChange(opt.key, value)}
                    size="small"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
