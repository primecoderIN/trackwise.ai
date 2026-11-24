// Reusable searchable IANA timezone selector built from Popover, Input and Intl.supportedValuesOf. Part of
// shared/components. Used by WelcomeDialog (app/_frame/) and PreferencesCard (features/account/).

import { Check, ChevronsUpDown, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { allTimezones, filterTimezones, formatTimezoneOffset } from "@/shared/lib/timezones"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

/** Props for the searchable IANA timezone picker. */
export interface TimezonePickerProps {
  id?: string
  value: string
  onChange: (timezone: string) => void
  disabled?: boolean
  ariaLabel?: string
}

function TimezoneOption({
  zone,
  selected,
  onSelect,
}: {
  zone: string
  selected: boolean
  onSelect: (zone: string) => void
}) {
  const offset = formatTimezoneOffset(zone)
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(zone)}
        className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
          selected ? "bg-accent/70 font-medium" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Check className={`size-3.5 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
          <span className="truncate">{zone}</span>
        </span>
        {offset && <span className="shrink-0 text-[11px] text-muted-foreground">{offset}</span>}
      </button>
    </li>
  )
}

/** Searchable popover picker for choosing an IANA timezone name (e.g. "America/New_York", "UTC"). */
export function TimezonePicker({ id, value, onChange, disabled, ariaLabel }: TimezonePickerProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const zones = useMemo(() => allTimezones(), [])
  const matches = useMemo(() => filterTimezones(zones, query), [zones, query])
  const selectedOffset = formatTimezoneOffset(value)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setQuery("")
  }

  function handleSelect(zone: string) {
    onChange(zone)
    setOpen(false)
    setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={ariaLabel ?? t("timezone.choose")}
          disabled={disabled}
          className="h-8 w-full justify-between px-2.5 text-sm font-normal"
        >
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <span className="truncate">{value}</span>
            {selectedOffset && <span className="shrink-0 text-xs text-muted-foreground">({selectedOffset})</span>}
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("timezone.searchPlaceholder")}
            aria-label={t("timezone.searchLabel")}
            className="h-8 pl-8 text-xs"
          />
        </div>
        {matches.length > 0 ? (
          <ul aria-label={t("timezone.listLabel")} className="mt-1.5 flex max-h-60 flex-col gap-0.5 overflow-y-auto">
            {matches.map((zone) => (
              <TimezoneOption key={zone} zone={zone} selected={zone === value} onSelect={handleSelect} />
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 py-4 text-center text-xs text-muted-foreground">{t("timezone.empty")}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
