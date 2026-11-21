// Web App Manifest (`/manifest.webmanifest`) served by Next.js App Router for PWA metadata and search crawlers.

import type { MetadataRoute } from "next"

import { APP_DESCRIPTION, APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"

/** Web App Manifest declaring trackwise.ai's name, theme colors, and crisp icon formats. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — AI Expense Tracker`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: ROUTES.landing,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}
