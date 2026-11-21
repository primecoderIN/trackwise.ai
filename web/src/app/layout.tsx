// The root layout: the <html> and <body> every page is drawn in, rendered on the server. Part of the app composition
// (app/). It carries the site's metadata (app/_seo/seo.ts), the global stylesheet, and the script that applies the
// saved theme before the first paint. The pages themselves are under (client)/, whose layout boots the browser-side
// app.

import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-constants"

import "./_styles/index.css"
import { siteMetadata } from "./_seo/seo"

/** The metadata every page starts from: title template, description, icon, link preview (app/_seo/seo.ts). */
export const metadata: Metadata = siteMetadata()

/** The viewport and responsive theme colors for mobile and desktop browsers. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

/**
 * The document around every page. The theme script runs in <head>, before anything is painted, so dark mode never
 * flashes light first; it may add the "dark" class to <html> before React takes over, hence
 * suppressHydrationWarning on that one element.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
