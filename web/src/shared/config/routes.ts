// Every page's address, in one place. Part of shared/config, so features can link to a page without importing the app.
// Used by app/_frame/pages.tsx (the menu), app/robots.ts and app/sitemap.ts, the sign-in page's gate, and links such as
// the Dashboard's "View all".

import { AUTH } from "@/shared/api/contracts.gen"
import { DEFAULT_LANGUAGE, type Language } from "@/shared/i18n/languages"

/** Each page's path. A new page gets its address here, then its route file under app/ and its menu entry. */
export const ROUTES = {
  landing: "/",
  landingHi: "/hi",
  howItWorks: "/how-it-works",
  howItWorksHi: "/hi/how-it-works",
  features: "/features",
  featuresHi: "/hi/features",
  faq: "/faq",
  faqHi: "/hi/faq",
  contact: "/contact",
  contactHi: "/hi/contact",
  privacy: "/privacy-policy",
  privacyHi: "/hi/privacy-policy",
  terms: "/terms-of-service",
  termsHi: "/hi/terms-of-service",
  dashboard: AUTH.dashboardPage,
  expenses: "/expenses",
  budgets: "/budgets",
  categories: "/categories",
  reports: "/reports",
  settings: "/settings",
  // The server sends people here when a sign-in fails and after signing out, so the path comes from the contract.
  signIn: AUTH.signInPage,
} as const

/** Formats a public route path for `language` (omitting prefix for DEFAULT_LANGUAGE, matching `localePrefix: "as-needed"`). */
export function localizedPath(path: string, language: Language): string {
  if (language === DEFAULT_LANGUAGE) return path
  return path === "/" ? `/${language}` : `/${language}${path}`
}
