// Pure UPI VPA syntax validation, NPCI upi://pay URI builder (INR only), and settlement reminder formatting (D225).
// No React dependencies; never trusts raw user URLs or auto-marks settlements as paid.

import { SPLITS } from "@/shared/api/contracts.gen"

const UPI_REGEX = new RegExp(SPLITS.upiPattern)
const MAX_UPI_TEXT_LEN = 50
const INR_CURRENCY = "INR"

/** Returns true when `value` matches strict UPI VPA syntax (`name@bank`). Syntax-only, never bank-verified. */
export function isValidUpiId(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= SPLITS.limits.upiIdLength && UPI_REGEX.test(trimmed)
}

/** Inputs required to construct a validated INR `upi://pay` payment URI for an outstanding settlement. */
export interface UpiPayParams {
  upiId: string | null | undefined
  payeeName: string
  amountMajor: string
  currency: string
  note?: string
}

/**
 * Builds a strictly URL-encoded `upi://pay` URI when `currency === "INR"`, `upiId` passes VPA syntax validation, and
 * `amountMajor` is positive. Always pass the actual settlement amount (never the original split total).
 */
export function buildUpiPayUri({ upiId, payeeName, amountMajor, currency, note }: UpiPayParams): string | null {
  if (currency !== INR_CURRENCY || !upiId || !isValidUpiId(upiId)) return null
  const numeric = Number(amountMajor)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  const params = new URLSearchParams({
    pa: upiId.trim(),
    pn: payeeName.trim().slice(0, MAX_UPI_TEXT_LEN) || "Recipient",
    am: numeric.toFixed(2),
    cu: INR_CURRENCY,
    tn: (note?.trim() || "Settlement via trackwise.ai").slice(0, MAX_UPI_TEXT_LEN),
  })
  return `upi://pay?${params.toString()}`
}
