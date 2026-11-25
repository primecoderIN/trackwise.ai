// Locale-aware navigation primitives for `[lang]` public routes (`/` and `/hi/...`). Signed-in `(app)` routes use
// standard `next/link` and `next/navigation` directly because workspace URLs stay unprefixed across languages.

import { createNavigation } from "next-intl/navigation"

import { routing } from "./routing"

/** Typed next-intl navigation helpers bound to `routing`. */
export const {
  Link: PublicLink,
  redirect: publicRedirect,
  usePathname: usePublicPathname,
  useRouter: usePublicRouter,
  getPathname: getPublicPathname,
} = createNavigation(routing)
