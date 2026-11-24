// IANA timezone helpers: listing supported zones, detecting the browser's zone, formatting GMT offsets, and
// filtering for the searchable picker. Part of shared/lib. Used by TimezonePicker (shared/components/),
// WelcomeDialog (app/_frame/) and PreferencesCard (features/account/).

import { DEFAULT_TIMEZONE } from "@/shared/api/contracts.gen"

// Fallback list for environments without Intl.supportedValuesOf (always includes DEFAULT_TIMEZONE).
const FALLBACK_TIMEZONES: readonly string[] = [
  DEFAULT_TIMEZONE,
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Zurich",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
]

// Maximum visible matches in the picker list so typing stays instant across ~400 IANA zones.
const DEFAULT_FILTER_LIMIT = 60

let cachedZones: readonly string[] | undefined
const offsetCache = new Map<string, string>()

/** All IANA timezone names offered by the runtime (guaranteed to include DEFAULT_TIMEZONE). */
export function allTimezones(): readonly string[] {
  if (cachedZones) return cachedZones
  try {
    if (typeof Intl.supportedValuesOf === "function") {
      const zones = Intl.supportedValuesOf("timeZone")
      cachedZones = zones.includes(DEFAULT_TIMEZONE) ? zones : [DEFAULT_TIMEZONE, ...zones]
      return cachedZones
    }
  } catch {
    // Fall back to curated zones if Intl.supportedValuesOf is unavailable or throws.
  }
  cachedZones = FALLBACK_TIMEZONES
  return cachedZones
}

/** Whether `zone` is a valid IANA timezone understood by this browser's Intl runtime. */
export function isValidTimezone(zone: string): boolean {
  if (!zone.trim()) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone })
    return true
  } catch {
    return false
  }
}

/**
 * The browser's current IANA timezone (e.g. "America/New_York" or "Asia/Kolkata"), or DEFAULT_TIMEZONE ("UTC") if
 * detection fails or returns an unrecognized value.
 */
export function detectBrowserTimezone(): string {
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected && isValidTimezone(detected)) return detected
  } catch {
    // Older runtimes or blocked Intl: fall back cleanly to UTC.
  }
  return DEFAULT_TIMEZONE
}

/** Short current GMT offset label for `timeZone`, e.g. "GMT-5" or "GMT+5:30" (empty string if unavailable). */
export function formatTimezoneOffset(timeZone: string): string {
  const existing = offsetCache.get(timeZone)
  if (existing !== undefined) return existing
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date())
    const label = parts.find((part) => part.type === "timeZoneName")?.value ?? ""
    offsetCache.set(timeZone, label)
    return label
  } catch {
    offsetCache.set(timeZone, "")
    return ""
  }
}

/**
 * Case-insensitive substring filter over IANA timezone names (treating underscores as spaces so "new york" matches
 * "America/New_York"). Capped at `limit` entries for snappy rendering.
 */
export function filterTimezones(zones: readonly string[], query: string, limit = DEFAULT_FILTER_LIMIT): string[] {
  const needle = query.trim().toLowerCase().replaceAll("_", " ")
  if (!needle) return zones.slice(0, limit)
  const matches: string[] = []
  for (const zone of zones) {
    if (zone.toLowerCase().replaceAll("_", " ").includes(needle)) {
      matches.push(zone)
      if (matches.length >= limit) break
    }
  }
  return matches
}
