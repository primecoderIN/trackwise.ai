// Shared helpers for user-facing errors, translation-aware formatting via `next-intl`, error logging, and aborts.
// Part of shared/lib. Used by pages, dialogs, toasts, error boundaries (`useMessageOf` / `messageOf`), TanStack Query,
// and the HTTP client (`ApiError`).

import commonEn from "@/shared/i18n/common/en"
import type { CommonTexts } from "@/shared/i18n/common"

/** Key under the `common.errors` message group. */
export type CommonErrorKey = keyof CommonTexts["errors"]

/** Values interpolated into an error message template. */
export type ErrorTranslationValues = Record<string, string | number>

/** Structured reference to a localized error message in the `common.errors` namespace. */
export interface ErrorTranslation {
  readonly key: CommonErrorKey
  readonly values?: ErrorTranslationValues
}

/** Function resolving a `common.errors` key and placeholders in the active locale. */
export type ErrorTranslator = (key: CommonErrorKey, values?: ErrorTranslationValues) => string

/** Interpolates `{key}` placeholders in an error message template. */
export function formatErrorTemplate(template: string, values: ErrorTranslationValues = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : `{${name}}`,
  )
}

/**
 * An error whose message was written for people: a server problem detail, run error (D180), or a localized
 * client error key (`translation`) rendered via `useMessageOf()`.
 */
export class UserFacingError extends Error {
  readonly translation?: ErrorTranslation

  constructor(message: string, translation?: ErrorTranslation) {
    super(message)
    this.translation = translation
  }
}

/**
 * Resolves a displayable message for anything thrown: translates structured `UserFacingError` keys or returns
 * server-authored messages; falls back to the localized generic unexpected error text for developer/runtime errors.
 */
export function messageOf(error: unknown, translate?: ErrorTranslator): string {
  if (error instanceof UserFacingError) {
    return error.translation && translate ? translate(error.translation.key, error.translation.values) : error.message
  }
  return translate ? translate("unexpected") : commonEn.errors.unexpected
}

/** Logs non-abort, non-user-facing errors to the console so developer diagnostics stay intact. */
export function reportUnexpected(error: unknown): void {
  if (!isAbort(error) && !(error instanceof UserFacingError)) console.error(error)
}

/** Whether `error` represents an intentionally cancelled request (`AbortError`). */
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}
