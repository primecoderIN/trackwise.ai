// Root layout for the browser-side signed-in workspace (`(client)/`).
// Provides the HTML document shell, theme boot script, global styles, and `ClientRoot`.

import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

import { SITE_VIEWPORT, siteMetadata } from "@/app/_seo/seo"
import { ClientRoot } from "@/app/_shell/client-root"
import { THEME_BOOT_SCRIPT } from "@/shared/theme/theme-constants"

import "../_styles/index.css"

/** Base site metadata for workspace routes. */
export const metadata: Metadata = siteMetadata()

/** Shared viewport and theme colors. */
export const viewport: Viewport = SITE_VIEWPORT

/** Root HTML document for signed-in workspace pages. */
export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  )
}
