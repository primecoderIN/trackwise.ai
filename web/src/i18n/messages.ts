// Server-side message loading and route-scoping utilities for next-intl namespaces.
// Allows layouts and routes to send only the translation namespaces each client subtree actually uses.

import { loadAppNamespace } from "@/app/_i18n"
import { loadCommonMessages, type Language } from "@/shared/i18n"

import type { AppMessages } from "./global"

/** Baseline namespaces required across interactive app shell, sign-in, and error boundaries. */
export const BOOT_MESSAGE_NAMESPACES = ["common", "app"] as const

/** Loads the typed message catalogs needed for `locale` (called per request in `src/i18n/request.ts`). */
export async function loadAppMessages(locale: Language): Promise<AppMessages> {
  const [common, app] = await Promise.all([loadCommonMessages(locale), loadAppNamespace(locale)])
  return { common, app }
}

/** Selects a subset of loaded namespaces to serialize across a route's `<NextIntlClientProvider>`. */
export function pickMessages<K extends keyof AppMessages>(
  messages: AppMessages | Record<string, unknown>,
  namespaces: readonly K[],
): Partial<AppMessages> {
  const selected: Record<string, unknown> = {}
  const record = messages as Record<string, unknown>
  for (const name of namespaces) {
    if (Object.hasOwn(record, name)) {
      selected[name] = record[name]
    }
  }
  return selected as Partial<AppMessages>
}
