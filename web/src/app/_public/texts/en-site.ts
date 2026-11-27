// English texts for the public site's navigation, footer, home page, and contact page (Phase 29).
// Uses global, consumer-friendly wording with zero technical jargon. Part of app/_public/texts/.

import { APP_NAME } from "@/shared/config/app"

import { EN_PRIVACY_TEXTS, EN_TERMS_TEXTS } from "./en-legal"
import { EN_WALKTHROUGH_TEXTS } from "./en-walkthrough"
import type { PublicSiteTexts } from "./types"

type SiteCoreTexts = Pick<
  PublicSiteTexts,
  "lang" | "nav" | "footer" | "landing" | "privacyPage" | "termsPage" | "contactPage"
>

/** English navigation, landing, legal, and contact texts. */
export const EN_SITE_TEXTS: SiteCoreTexts = {
  lang: "en",
  nav: {
    howItWorks: "How It Works",
    features: "Features",
    faq: "FAQ",
    contact: "Contact",
    signIn: "Sign in",
    openApp: "Open Dashboard",
    primaryLabel: "Primary navigation",
    menuLabel: "Open menu",
  },
  footer: {
    tagline: `${APP_NAME} — AI expense tracking, bill splitting, receipt scanning, monthly budgets, and clear reports in English and Hindi.`,
    rights: `© 2026 ${APP_NAME}. Built with private per-account isolation and clear user confirmation.`,
    productHeading: "Product",
    supportHeading: "Help & Support",
    legalHeading: "Legal",
    languageHeading: "Language",
    home: "Home",
    howItWorks: "How It Works",
    features: "Features",
    signIn: "Sign in",
    faq: "FAQ",
    contact: "Contact",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    languageLabel: "Switch language",
  },
  landing: {
    title: "AI Expense Tracker, Bill Splitting, Receipt Scanner & Monthly Budgets",
    metaDescription:
      "Track daily spending through natural conversation, split bills in Personal or Shared groups with invite links and opt-in INR UPI QR codes, scan receipts with review, monitor budgets, and export reports in English and Hindi.",
    keywords: [
      "AI expense tracker",
      "bill splitting app",
      "shared group expenses",
      "receipt scanner app",
      "monthly budget planner",
      "personal expense manager",
      "bilingual spending tracker",
      APP_NAME,
    ],
    badge: "Bilingual AI Expense & Splits Workspace · English & हिन्दी",
    heroTitle: "Track every expense and split shared bills—through chat, receipts, or calm ledgers.",
    heroSubtitle: `${APP_NAME} brings together a fast personal ledger, Personal & Shared bill-splitting groups with invite links and opt-in UPI QR codes, an AI chat assistant with review cards, receipt scanning, and monthly budget tracking.`,
    getStarted: "Get started",
    openDashboard: "Open Dashboard",
    howItWorksCta: "See how it works",
    trustStrip: [
      "No private data in browser storage",
      "Private expenses even in shared groups",
      "Review before saving or deleting",
      "Available in English and Hindi",
    ],
    walkthrough: EN_WALKTHROUGH_TEXTS,
    pillarsTitle: "Everything you need in one calm workspace",
    pillarsSubtitle:
      "Focused tools for capturing daily purchases, splitting shared bills, watching budgets, and exporting summaries—without clutter.",
    pillars: [
      {
        eyebrow: "AI Assistant & Receipts",
        title: "Chat naturally, review details, confirm deletes",
        description:
          "Log purchases in plain words, snap or upload receipt bills for automatic field extraction, and confirm before anything is deleted.",
        hrefKey: "features",
        hash: "#assistant",
        linkLabel: "Explore assistant & receipts",
      },
      {
        eyebrow: "Splits & Shared Groups",
        title: "Split bills cleanly—solo or together",
        description:
          "Create Personal or Shared groups, split equally or by exact amounts, claim guest seats via invite links, and settle up with opt-in INR UPI QR codes.",
        hrefKey: "features",
        hash: "#splits",
        linkLabel: "See bill splitting & groups",
      },
      {
        eyebrow: "Currencies, Budgets & Reports",
        title: "Multi-currency ledger, pace meters & exports",
        description:
          "Record spending across global currencies, catch early 80% budget alerts against the day of the month, and export CSV or Markdown reports.",
        hrefKey: "features",
        hash: "#budgets",
        linkLabel: "View budgets & reports",
      },
      {
        eyebrow: "Privacy & Control",
        title: "Built so your personal spending stays yours",
        description:
          "Passwordless sign-in, strict per-account isolation (personal expenses never leak into shared groups), session management, and explicit confirmations.",
        hrefKey: "faq",
        hash: "#privacy-security-languages",
        linkLabel: "Read privacy & safety FAQ",
      },
    ],
    workflowTitle: "Up and running in under a minute",
    workflowSubtitle: "Designed to remove tedious manual entry while keeping every save under your control.",
    workflowSteps: [
      {
        step: "01",
        title: "Sign in safely & set your preferences",
        description:
          "Sign in with your trusted provider account, pick your language (English or Hindi), default currency, and timezone, and optionally set an initial monthly limit.",
      },
      {
        step: "02",
        title: "Capture expenses & split shared bills",
        description:
          "Type what you spent in chat, scan a receipt photo or PDF, edit rows in your ledger, or split group bills and privately log strictly your own share.",
      },
      {
        step: "03",
        title: "Settle balances, watch pace & export reports",
        description:
          "Keep every group's balance isolated by currency, settle up cleanly, spot 80% budget alerts early, and download CSV or Markdown summaries anytime.",
      },
    ],
    workflowCta: "See the full step-by-step guide",
    bilingualBannerTitle: "Bilingual by design for everyday clarity",
    bilingualBannerSubtitle:
      "Every page, budget alert, assistant reply, and downloadable monthly report switches smoothly between English and Hindi.",
    bilingualCta: "View in हिन्दी",
    ctaTitle: "Take calm control of your monthly spending",
    ctaSubtitle: "Sign in to open your Dashboard, or explore our FAQ to see how every feature keeps you in control.",
    faqCta: "Read all FAQs",
  },
  privacyPage: EN_PRIVACY_TEXTS,
  termsPage: EN_TERMS_TEXTS,
  contactPage: {
    title: "Contact & Support",
    metaDescription: `Get product help, share feedback, or submit a privacy and data request to the ${APP_NAME} team worldwide.`,
    keywords: ["contact trackwise.ai", "expense tracker support", "privacy data requests", APP_NAME],
    intro: `Have a question about ${APP_NAME}, need help with your account, or want to reach our team about your data privacy anywhere in the world? Contact us directly below.`,
    supportHeading: "Product Support",
    supportBody: "For questions about features, account help, feedback, or bug reports:",
    supportEmail: "support@trackwise.ai",
    privacyHeading: "Privacy & Data Requests",
    privacyBody: "For privacy inquiries, data access questions, correction requests, or account deletion:",
    privacyEmail: "privacy@trackwise.ai",
    responseNote: "We review all support and privacy inquiries promptly and aim to reply as quickly as possible.",
  },
}
