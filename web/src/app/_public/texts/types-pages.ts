// Page-specific text interfaces for How It Works, Features, FAQ, Contact, and Legal pages (Phase 29).
// Part of app/_public/texts/. Imported by types.ts so every text file stays compact and type-checked.

/** One step shown on the dedicated `/how-it-works` page. */
export interface HowItWorksStep {
  step: string
  title: string
  description: string
  detail: string
}

/** One plain-language control or privacy assurance card on `/how-it-works`. */
export interface ControlGuarantee {
  title: string
  description: string
}

/** Dedicated `/how-it-works` page texts. */
export interface HowItWorksPageTexts {
  title: string
  metaDescription: string
  keywords: readonly string[]
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  getStarted: string
  openDashboard: string
  exploreFeatures: string
  stepsTitle: string
  stepsSubtitle: string
  steps: readonly HowItWorksStep[]
  guaranteesTitle: string
  guaranteesSubtitle: string
  guarantees: readonly ControlGuarantee[]
  ctaTitle: string
  ctaSubtitle: string
  readFaq: string
}

/** One feature section on `/features`, paired with a UI preview card. */
export interface FeatureShowcaseSection {
  id: string
  badge: string
  title: string
  summary: string
  highlights: readonly string[]
  previewKind: "assistant" | "receipts" | "expenses" | "budgets" | "reports" | "workspace"
}

/** One row in the surface comparison matrix on `/features`. */
export interface SurfaceCapabilityRow {
  capability: string
  webApp: string
  assistant: string
  receipts: string
}

/** Dedicated `/features` page texts. */
export interface FeaturesPageTexts {
  title: string
  metaDescription: string
  keywords: readonly string[]
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
    expensesPrimaryTitle: string
    expensesPrimaryAmount: string
    expensesPrimaryNote: string
    expensesSecondaryNote: string
    budgetOverallLabel: string
    budgetOverallValue: string
    budgetPaceNote: string
    budgetAlertNote: string
    reportMonth: string
    reportDelta: string
    reportDailyAvg: string
    reportCsvLabel: string
    reportMdLabel: string
    workspaceHeader: string
    workspaceShortcutLabel: string
    workspaceSessionNote: string
    workspaceItems: readonly string[]
  }
  matrixTitle: string
  matrixSubtitle: string
  matrixHeaders: { capability: string; webApp: string; assistant: string; receipts: string }
  matrixRows: readonly SurfaceCapabilityRow[]
  ctaTitle: string
  ctaSubtitle: string
  howItWorksCta: string
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
  keywords: readonly string[]
  heroBadge: string
  heroTitle: string
  heroSubtitle: string
  categories: readonly FaqCategory[]
  ctaTitle: string
  ctaSubtitle: string
  contactCta: string
  featuresCta: string
}

/** Retained legal document structure (`/privacy-policy` and `/terms-of-service`). */
export interface LegalPageTexts {
  title: string
  metaDescription: string
  updated: string
  intro: string
  sections: readonly { heading: string; body: string }[]
}
