// Type definitions for the server-rendered bilingual public site (English and Hindi, Phase 29). Part of app/_public/texts/.
// Every language catalog implements PublicSiteTexts so missing keys fail TypeScript at build time.

import type { Language } from "@/shared/i18n"

import type { FaqPageTexts, FeaturesPageTexts, HowItWorksPageTexts, LegalPageTexts } from "./types-pages"

/** Keys for every public route in the navigation and footer. */
export type PublicRouteKey = "landing" | "howItWorks" | "features" | "faq" | "contact" | "privacy" | "terms"

/** Right-hand balance, privacy, and share breakdown texts for the Splits walkthrough scene. */
export interface WalkthroughSplitsPanelTexts {
  kpiLabel: string
  kpiBefore: string
  kpiAfter: string
  panelTitle: string
  groupBadge: string
  inviteLine: string
  shareLabels: readonly [string, string, string]
  transferLines: readonly [string, string]
  privateChip: string
  footerNote: string
}

interface WalkthroughSceneBase {
  chapterLabel: string
  actionCaption: string
  navLabel: string
  primaryTitle: string
  primaryMeta: string
  secondaryLabel: string
  secondaryValue: string
  actionButtonLabel: string
  doneStatus: string
}

/** An assistant-driven scene in the animated hero walkthrough player. */
export interface AssistantWalkthroughSceneTexts extends WalkthroughSceneBase {
  id: "expenses" | "receipts" | "assistant" | "reports"
  assistantPrompt: string
  assistantChip: string
  assistantReply: string
}

/** The dedicated Splits workspace scene in the animated hero walkthrough player. */
export interface SplitsWalkthroughSceneTexts extends WalkthroughSceneBase {
  id: "splits"
  splitsPanel: WalkthroughSplitsPanelTexts
}

/** One interactive scene in the animated hero walkthrough player. */
export type WalkthroughSceneTexts = AssistantWalkthroughSceneTexts | SplitsWalkthroughSceneTexts

/** Complete bilingual texts for the animated product walkthrough player on `/` and `/hi`. */
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
  sidebarSplits: string
  sidebarReports: string
  kpiLabel: string
  kpiBefore: string
  kpiAfter: string
  assistantTitle: string
  scenes: readonly [
    WalkthroughSceneTexts,
    WalkthroughSceneTexts,
    WalkthroughSceneTexts,
    WalkthroughSceneTexts,
    WalkthroughSceneTexts,
  ]
}

/** A single feature pillar summary card shown on the home page and linked to a public page. */
export interface PillarSummary {
  eyebrow: string
  title: string
  description: string
  hrefKey: "howItWorks" | "features" | "faq"
  hash: string
  linkLabel: string
}

/** Complete server-rendered texts for one public language (`en` or `hi`). */
export interface PublicSiteTexts {
  lang: Language
  nav: {
    howItWorks: string
    features: string
    faq: string
    contact: string
    signIn: string
    openApp: string
  }
  footer: {
    tagline: string
    rights: string
    productHeading: string
    supportHeading: string
    languageHeading: string
    home: string
    howItWorks: string
    features: string
    signIn: string
    faq: string
    contact: string
    languageLabel: string
  }
  landing: {
    title: string
    metaDescription: string
    keywords: readonly string[]
    badge: string
    heroTitle: string
    heroSubtitle: string
    getStarted: string
    openDashboard: string
    howItWorksCta: string
    trustStrip: readonly string[]
    walkthrough: WalkthroughTexts
    pillarsTitle: string
    pillarsSubtitle: string
    pillars: readonly PillarSummary[]
    workflowTitle: string
    workflowSubtitle: string
    workflowSteps: readonly { step: string; title: string; description: string }[]
    workflowCta: string
    bilingualBannerTitle: string
    bilingualBannerSubtitle: string
    bilingualCta: string
    ctaTitle: string
    ctaSubtitle: string
    faqCta: string
  }
  howItWorksPage: HowItWorksPageTexts
  featuresPage: FeaturesPageTexts
  faqPage: FaqPageTexts
  privacyPage: LegalPageTexts
  termsPage: LegalPageTexts
  contactPage: {
    title: string
    metaDescription: string
    keywords: readonly string[]
    intro: string
    supportHeading: string
    supportBody: string
    supportEmail: string
    privacyHeading: string
    privacyBody: string
    privacyEmail: string
    responseNote: string
  }
}

export type {
  ControlGuarantee,
  FaqCategory,
  FaqPageTexts,
  FeatureShowcaseSection,
  FeaturesPageTexts,
  HowItWorksPageTexts,
  HowItWorksStep,
  LegalPageTexts,
  SurfaceCapabilityRow,
} from "./types-pages"
