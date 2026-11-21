// Build-time 32x32 PNG favicon generated via Next.js App Router icon convention (`app/icon.tsx`).

import { renderBrandIcon } from "./_seo/brand-icon"

/** Dimensions of the generated browser tab icon. */
export const size = { width: 32, height: 32 }

/** MIME content type for the generated PNG icon. */
export const contentType = "image/png"

/** Render trackwise.ai's 32x32 PNG favicon. */
export default function Icon() {
  return renderBrandIcon(size.width)
}
