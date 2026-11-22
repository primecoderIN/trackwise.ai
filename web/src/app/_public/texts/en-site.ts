// English texts for the public site's navigation, footer, home page, and contact page (Phase 29).
// Uses global, consumer-friendly wording with zero technical jargon. Part of app/_public/texts/.

import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"

import { EN_PRIVACY_TEXTS, EN_TERMS_TEXTS } from "./en-legal"
import { EN_WALKTHROUGH_TEXTS } from "./en-walkthrough"
import type { PublicSiteTexts } from "./types"

type SiteCoreTexts = Pick<
  PublicSiteTexts,
  | "lang"
  | "otherLang"
  | "otherLangLabel"
  | "paths"
  | "otherPaths"
  | "nav"
  | "footer"
  | "landing"
  | "privacyPage"
  | "termsPage"
  | "contactPage"
>

/** English navigation, landing, legal, and contact texts. */
export const EN_SITE_TEXTS: SiteCoreTexts = {
  lang: "en",
  otherLang: "hi",
  otherLangLabel: "हिन्दी",
  paths: {
    landing: ROUTES.landing,
    howItWorks: ROUTES.howItWorks,
    features: ROUTES.features,
    faq: ROUTES.faq,
    contact: ROUTES.contact,
    privacy: ROUTES.privacy,
    terms: ROUTES.terms,
  },
  otherPaths: {
    landing: ROUTES.landingHi,
    howItWorks: ROUTES.howItWorksHi,
    features: ROUTES.featuresHi,
    faq: ROUTES.faqHi,
    contact: ROUTES.contactHi,
    privacy: ROUTES.privacyHi,
    terms: ROUTES.termsHi,
  },
  nav: {
    howItWorks: "How It Works",
    features: "Features",
    faq: "FAQ",
    contact: "Contact",
    signIn: "Sign in",
    openApp: "Open Dashboard",
  },
  footer: {
    tagline: `${APP_NAME} — AI expense tracking, receipt scanning, monthly budgets, and clear reports in English and Hindi.`,
    rights: `© 2026 ${APP_NAME}. Built with private per-account isolation and clear user confirmation.`,
    productHeading: "Product",
    supportHeading: "Help & Support",
    languageHeading: "Language",
    home: "Home",
    howItWorks: "How It Works",
    features: "Features",
    signIn: "Sign in",
    faq: "FAQ",
    contact: "Contact",
    languageLabel: "Switch language",
  },
  landing: {
    title: "AI Expense Tracker, Receipt Scanner & Monthly Budgets",
    metaDescription:
      "Track daily spending through natural conversation, scan receipts with review before saving, monitor monthly budgets, and export clean reports in English and Hindi.",
    keywords: [
      "AI expense tracker",
      "receipt scanner app",
      "monthly budget planner",
      "personal expense manager",
      "bilingual spending tracker",
      APP_NAME,
    ],
    badge: "Bilingual AI Expense Workspace · English & हिन्दी",
    heroTitle: "Track every expense through conversation, receipts, or calm spreadsheets.",
    heroSubtitle: `${APP_NAME} brings together a fast personal ledger, an AI chat assistant with interactive review cards, receipt scanning with confirmation, and monthly budget tracking.`,
    getStarted: "Get started",
    openDashboard: "Open Dashboard",
    howItWorksCta: "See how it works",
    trustStrip: [
      "No private data in browser storage",
      "Strict per-account data privacy",
      "Review before saving or deleting",
      "Available in English and Hindi",
    ],
    walkthrough: EN_WALKTHROUGH_TEXTS,
    pillarsTitle: "Everything you need in one calm workspace",
    pillarsSubtitle:
      "Focused tools for capturing daily purchases, watching budgets, and exporting summaries—without clutter.",
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
        eyebrow: "Expenses & Global Currencies",
        title: "Fast ledger across everyday currencies",
        description:
          "Search, filter, sort, and edit entries inline while keeping original amounts tagged in USD, EUR, GBP, and more.",
        hrefKey: "features",
        hash: "#expenses",
        linkLabel: "See ledger & currencies",
      },
      {
        eyebrow: "Budgets & Monthly Reports",
        title: "Pace meters and one-click downloads",
        description:
          "Watch category and overall limits against the day of the month, catch early 80% alerts, and export CSV or Markdown reports.",
        hrefKey: "features",
        hash: "#budgets",
        linkLabel: "View budgets & reports",
      },
      {
        eyebrow: "Privacy & Control",
        title: "Built so your spending stays strictly yours",
        description:
          "Passwordless sign-in via trusted providers, per-account isolation, remote session management, and explicit confirmation prompts.",
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
        title: "Sign in safely & pick your language",
        description:
          "Sign in with your trusted provider account, choose English or Hindi, and optionally set an initial monthly limit.",
      },
      {
        step: "02",
        title: "Capture via chat, receipt upload, or ledger",
        description:
          "Type what you spent in plain language, attach a receipt photo or PDF, or add and edit rows directly in the table.",
      },
      {
        step: "03",
        title: "Track budget pace & export reports",
        description:
          "Spot 80% spending alerts early, inspect monthly trends, and download clean CSV or Markdown summaries anytime.",
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
