// Open Graph and X card preview image for SpendWise, generated at build time by Next.js (`next/og`, Phase 29).
// Part of the app composition (app/opengraph-image.tsx).

import { ImageResponse } from "next/og"

import { APP_DESCRIPTION, APP_NAME } from "@/shared/config/app"

/** Alt text for the generated social preview image. */
export const alt = `${APP_NAME} — ${APP_DESCRIPTION}`

/** Standard Open Graph 1200x630 dimensions. */
export const size = { width: 1200, height: 630 }

/** PNG media type for Open Graph compatibility. */
export const contentType = "image/png"

/** Renders SpendWise's Open Graph card image. */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #0f172a 100%)",
        color: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "36px", fontWeight: 700 }}>
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "14px",
            background: "#4f46e5",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
          }}
        >
          ₹
        </div>
        <span>{APP_NAME}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "960px" }}>
        <div style={{ fontSize: "64px", fontWeight: 700, lineHeight: 1.15 }}>
          AI Expense Tracker, Receipt Scanner & Monthly Budgets
        </div>
        <div style={{ fontSize: "28px", color: "#cbd5e1", lineHeight: 1.4 }}>{APP_DESCRIPTION}</div>
      </div>
      <div style={{ display: "flex", gap: "24px", fontSize: "22px", color: "#e2e8f0" }}>
        <span>• Assistant & A2UI Cards</span>
        <span>• Receipt Scanning</span>
        <span>• Multi-Currency (INR)</span>
        <span>• English & Hindi</span>
      </div>
    </div>,
    size,
  )
}
