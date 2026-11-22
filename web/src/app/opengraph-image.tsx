// Open Graph and X card preview image for trackwise.ai, generated at build time by Next.js (`next/og`, Phase 29).
// Part of the app composition (app/opengraph-image.tsx). Uses global, consumer-friendly branding and highlights.

import { ImageResponse } from "next/og"

import { APP_DESCRIPTION, APP_NAME } from "@/shared/config/app"

/** Alt text for the generated social preview image. */
export const alt = `${APP_NAME} — ${APP_DESCRIPTION}`

/** Standard Open Graph 1200x630 dimensions. */
export const size = { width: 1200, height: 630 }

/** PNG media type for Open Graph compatibility. */
export const contentType = "image/png"

/** Renders trackwise.ai's global Open Graph card image. */
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
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </svg>
        </div>
        <span>{APP_NAME}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "960px" }}>
        <div style={{ fontSize: "62px", fontWeight: 700, lineHeight: 1.15 }}>
          AI Expense Tracker, Receipt Scanner & Monthly Budgets
        </div>
        <div style={{ fontSize: "28px", color: "#cbd5e1", lineHeight: 1.4 }}>{APP_DESCRIPTION}</div>
      </div>
      <div style={{ display: "flex", gap: "24px", fontSize: "22px", color: "#e2e8f0" }}>
        <span>• Conversational AI Assistant</span>
        <span>• Receipt Scanning</span>
        <span>• Monthly Budgets</span>
        <span>• English & Hindi</span>
      </div>
    </div>,
    size,
  )
}
