// Next.js 16 Proxy (network boundary) delegating public marketing & sign-in routes to next-intl (`[lang]`),
// while passing signed-in unprefixed workspace routes, legacy redirects, and static/API paths straight through.

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import createMiddleware from "next-intl/middleware"

import { routing } from "./i18n/routing"
import { ROUTES } from "./shared/config/routes"
import { DEFAULT_LANGUAGE, LANGUAGE_CODES } from "./shared/i18n/languages"

const handleI18nRouting = createMiddleware(routing)

const UNPREFIXED_APP_PREFIXES = [
  ROUTES.dashboard,
  ROUTES.expenses,
  ROUTES.budgets,
  ROUTES.categories,
  ROUTES.reports,
  ROUTES.settings,
] as const

const LEGACY_REDIRECT_PATHS = new Set<string>(
  LANGUAGE_CODES.flatMap((lang) => {
    const prefix = lang === DEFAULT_LANGUAGE ? "" : `/${lang}`
    return [`${prefix}/security`, `${prefix}/privacy`, `${prefix}/terms`]
  }),
)

function isUnprefixedAppPath(pathname: string): boolean {
  return UNPREFIXED_APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/** Routes public paths through next-intl `[lang]` resolution and leaves signed-in workspace paths unprefixed. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (isUnprefixedAppPath(pathname) || LEGACY_REDIRECT_PATHS.has(pathname)) {
    return NextResponse.next()
  }
  return handleI18nRouting(request)
}

export const config = {
  matcher: [
    "/((?!api|mcp|_next|_vercel|opengraph-image|icon|apple-icon|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
}
