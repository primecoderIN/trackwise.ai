// Native React SVG QR code renderer built on uqr@0.1.3 encode() matrix (D225).
// Uses a single vector <path> over a white quiet-zone <rect> — zero dangerouslySetInnerHTML, zero canvas, dark-mode safe.

import { useMemo } from "react"
import { encode } from "uqr"

const QR_BORDER_MODULES = 2

/** Props for rendering a scannable vector QR code from a validated URI. */
export interface UpiQrSvgProps {
  /** Strictly validated `upi://pay?...` URI to encode. */
  uri: string
  /** Accessible description announced to screen readers. */
  label: string
  /** Display width and height in CSS pixels. */
  size?: number
}

/** Crisp vector QR code rendered with native React SVG elements and an explicit white quiet zone. */
export function UpiQrSvg({ uri, label, size = 200 }: UpiQrSvgProps) {
  const { modules, path } = useMemo(() => {
    const qr = encode(uri, { ecc: "M", border: QR_BORDER_MODULES })
    const segments: string[] = []
    for (let row = 0; row < qr.size; row += 1) {
      const line = qr.data[row]
      if (!line) continue
      for (let col = 0; col < qr.size; col += 1) {
        if (line[col]) segments.push(`M${col} ${row}h1v1h-1z`)
      }
    }
    return { modules: qr.size, path: segments.join("") }
  }, [uri])

  return (
    <svg
      aria-label={label}
      viewBox={`0 0 ${modules} ${modules}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className="rounded-md border bg-white shadow-xs"
    >
      <title>{label}</title>
      <rect width={modules} height={modules} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  )
}
