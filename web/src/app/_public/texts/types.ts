// Type definitions for the server-rendered bilingual public site (English and Hindi, Phase 29). Part of app/_public/texts/.
// Every language catalog implements PublicSiteTexts so missing keys fail TypeScript at build time.

import type { Language } from "@/shared/i18n"

/** Keys for every public route pair in `paths` and `otherPaths`. */
export type PublicRouteKey = "landing" | "features" | "security" | "faq" | "privacy" | "terms" | "contact"

/** Navigation links shared by the sticky SaaS header and footer. */
export type PublicRouteMap = Record<PublicRouteKey, string>

/** One interactive scene in the animated hero walkthrough video player. */
export interface WalkthroughSceneTexts {
  id: "expenses" | "receipts" | "assistant" | "reports"
  chapterLabel: string
  actionCaption: string
  navLabel: string
  primaryTitle: string
  primaryMeta: string
  secondaryLabel: string
  secondaryValue: string
  actionButtonLabel: string
  doneStatus: string
  assistantPrompt: string
  assistantChip: string
  assistantReply: string
}

/** Complete bilingual texts for the animated product walkthrough video player on `/` and `/hi`. */
export interface WalkthroughTexts {
  windowTitle: string
  liveBadge: string
  playLabel: string
  pauseLabel: string
  restartLabel: string
  seekLabel: string
  sidebarOverview: string
  sidebarExpenses: string
  sidebarReceipts: string
  sidebarReports: string
  kpiLabel: string
  kpiBefore: string
  kpiAfter: string
  assistantTitle: string
  scenes: readonly [WalkthroughSceneTexts, WalkthroughSceneTexts, WalkthroughSceneTexts, WalkthroughSceneTexts]
}

/** A single feature pillar summary card shown on the home page and linked to a dedicated page. */
export interface PillarSummary {
  eyebrow: string
  title: string
  description: string
  hrefKey: "features" | "security"
  hash: string
  linkLabel: string
}

/** One rich feature section on `/features`, paired with a bespoke SaaS UI preview card. */
export interface FeatureShowcaseSection {
  id: string
  badge: string
  title: string
  summary: string
  highlights: readonly string[]
  previewKind: "assistant" | "receipts" | "expenses" | "budgets" | "reports" | "mcp"
}

/** One row in the "Every surface in sync" matrix on `/features`. */
export interface SurfaceCapabilityRow {
  capability: string
  webApp: string
  assistant: string
  mcp: string
}

/** Dedicated `/features` page texts. */
export interface FeaturesPageTexts {
  title: string
  metaDescription: string
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  getStarted: string
  openDashboard: string
  readFaq: string
  sections: readonly FeatureShowcaseSection[]
  previewData: {
    assistantHeader: string
    assistantUser: string
    assistantChip: string
    assistantApprovalTitle: string
    assistantApprovalMeta: string
    assistantApprove: string
    assistantCancel: string
    receiptBadge: string
    receiptMerchant: string
    receiptAmount: string
    receiptCategory: string
    receiptPayment: string
    receiptConfirm: string
    expensesSearchPlaceholder: string
    expensesCurrencyOrig: string
    expensesCurrencyInr: string
    expensesRateNote: string
    budgetOverallLabel: string
    budgetOverallValue: string
    budgetPaceNote: string
    budgetAlertNote: string
    reportMonth: string
    reportDelta: string
    reportDailyAvg: string
    reportCsvLabel: string
    reportMdLabel: string
    mcpHeader: string
    mcpTokenLabel: string
    mcpShortcutLabel: string
    mcpToolsList: readonly string[]
  }
  matrixTitle: string
  matrixSubtitle: string
  matrixHeaders: { capability: string; webApp: string; assistant: string; mcp: string }
  matrixRows: readonly SurfaceCapabilityRow[]
  ctaTitle: string
  ctaSubtitle: string
}

/** Dedicated `/security` page texts. */
export interface SecurityPageTexts {
  title: string
  metaDescription: string
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  pillars: readonly { badge: string; title: string; description: string; points: readonly string[] }[]
  matrixTitle: string
  matrixSubtitle: string
  matrixRows: readonly { threat: string; defense: string }[]
  complianceTitle: string
  complianceBody: string
  privacyLink: string
  termsLink: string
  contactLink: string
  faqLink: string
}

/** One grouped FAQ category with its jump slug and collapsible questions. */
export interface FaqCategory {
  id: string
  title: string
  description: string
  items: readonly { question: string; answer: string }[]
}

/** Dedicated `/faq` page texts. */
export interface FaqPageTexts {
  title: string
  metaDescription: string
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  categories: readonly FaqCategory[]
  ctaTitle: string
  ctaSubtitle: string
  contactCta: string
  featuresCta: string
}

/** Complete server-rendered texts for one public language (`en` or `hi`). */
export interface PublicSiteTexts {
  lang: Language
  otherLang: Language
  otherLangLabel: string
  paths: PublicRouteMap
  otherPaths: PublicRouteMap
  nav: {
    features: string
    security: string
    faq: string
    contact: string
    signIn: string
    openApp: string
  }
  footer: {
    tagline: string
    rights: string
    productHeading: string
    trustHeading: string
    legalHeading: string
    home: string
    features: string
    security: string
    faq: string
    privacy: string
    terms: string
    contact: string
    signIn: string
    languageLabel: string
  }
  landing: {
    title: string
    metaDescription: string
    badge: string
    heroTitle: string
    heroSubtitle: string
    getStarted: string
    openDashboard: string
    exploreFeatures: string
    trustStrip: readonly string[]
    walkthrough: WalkthroughTexts
    pillarsTitle: string
    pillarsSubtitle: string
    pillars: readonly PillarSummary[]
    workflowTitle: string
    workflowSubtitle: string
    workflowSteps: readonly { step: string; title: string; description: string }[]
    bilingualBannerTitle: string
    bilingualBannerSubtitle: string
    bilingualCta: string
    ctaTitle: string
    ctaSubtitle: string
    faqCta: string
  }
  featuresPage: FeaturesPageTexts
  securityPage: SecurityPageTexts
  faqPage: FaqPageTexts
  privacyPage: {
    title: string
    metaDescription: string
    updated: string
    intro: string
    sections: readonly { heading: string; body: string }[]
  }
  termsPage: {
    title: string
    metaDescription: string
    updated: string
    intro: string
    sections: readonly { heading: string; body: string }[]
  }
  contactPage: {
    title: string
    metaDescription: string
    intro: string
    supportHeading: string
    supportBody: string
    supportEmail: string
    grievanceHeading: string
    grievanceBody: string
    grievanceEmail: string
    responseNote: string
  }
}
