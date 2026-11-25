// Catch-all route inside `[lang]` so unknown public URLs (`/nonexistent`, `/hi/nonexistent`) render the localized
// `[lang]/not-found.tsx` boundary with an HTTP 404 response.

import { notFound } from "next/navigation"

/** Triggers Next.js segment `notFound()` for any unmatched `[lang]` path. */
export default function LocalizedCatchAll() {
  notFound()
}
