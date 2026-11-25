"use client"

// React hook binding `messageOf` to the active `next-intl` locale (`common.errors`).
// Components, dialogs, toast handlers, and error boundaries call `const messageOf = useMessageOf()`.

import { useTranslations } from "next-intl"
import { useCallback } from "react"

import { messageOf } from "./errors"

/** Returns a memoized `messageOf(error)` resolver translated in the active `next-intl` locale. */
export function useMessageOf(): (error: unknown) => string {
  const t = useTranslations("common")
  return useCallback((error: unknown) => messageOf(error, (key, values) => t(`errors.${key}`, values)), [t])
}
