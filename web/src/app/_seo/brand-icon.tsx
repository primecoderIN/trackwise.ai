// Shared vector artwork rendered into PNG favicons by app/icon.tsx and app/apple-icon.tsx (`next/og`).
// Matches the trackwise.ai Wallet badge shown across the header, sidebar, and Open Graph card.

import { ImageResponse } from "next/og"

/** Render the cobalt-indigo rounded Wallet badge as an `ImageResponse` PNG at the given square size. */
export function renderBrandIcon(boxSize: number): ImageResponse {
  const iconSize = Math.round(boxSize * 0.6)
  const radius = Math.round(boxSize * 0.24)
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: `${radius}px`,
        background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
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
    </div>,
    { width: boxSize, height: boxSize },
  )
}
