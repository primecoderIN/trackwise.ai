// English texts for the dedicated `/how-it-works` page. Part of app/_public/texts/.
// Explains the end-to-end user journey in plain, consumer-friendly, globally applicable language.

import { APP_NAME } from "@/shared/config/app"

import type { HowItWorksPageTexts } from "./types"

/** English texts for `/how-it-works`. */
export const EN_HOW_IT_WORKS_TEXTS: HowItWorksPageTexts = {
  title: "How It Works — Simple Daily Expense Tracking, Splits & Monthly Reports",
  metaDescription: `See how ${APP_NAME} works in four simple steps: passwordless sign-in, natural chat, receipt scanning or bill splitting, human review before saving or deleting, and monthly budget reports.`,
  keywords: [
    "how expense tracker works",
    "how bill splitting works",
    "AI receipt scanning workflow",
    "monthly budget tracking steps",
    "expense approval workflow",
    APP_NAME,
  ],
  heroBadge: "How It Works",
  heroTitle: "From everyday receipts to clear monthly insight in four steps.",
  heroSubtitle: `${APP_NAME} removes tedious spreadsheet entry while keeping every save, edit, and deletion under your direct control.`,
  getStarted: "Get started",
  openDashboard: "Open Dashboard",
  exploreFeatures: "Explore all features",
  stepsTitle: "Your daily workflow, step by step",
  stepsSubtitle:
    "Log purchases in the way that fits the moment, review AI suggestions cleanly, and stay ahead of your monthly limits.",
  steps: [
    {
      step: "01",
      title: "Sign in safely & set your preferences",
      description:
        "Use your existing Google or supported sign-in account—no extra passwords to remember. Choose English or Hindi, your default currency, and your timezone, and optionally set a monthly spending goal during first-time setup.",
      detail: "Ready in under a minute across desktop and mobile browsers.",
    },
    {
      step: "02",
      title: "Capture expenses, scan receipts, or split shared bills",
      description:
        "Type a quick message like “$14.50 for coffee by card”, upload a receipt image or PDF, edit your Expenses table, or add a split in a Personal or Shared group and privately log strictly your own share.",
      detail: "If any field is missing from a chat message, you get a clean pre-filled form instead of guesswork.",
    },
    {
      step: "03",
      title: "Review and confirm before anything changes",
      description:
        "Scanned receipt details appear in an editable preview card so you can verify merchant, amount, currency code, date, and category before saving. Delete requests always pause for your explicit confirmation.",
      detail: "The assistant assists—you always have the final word.",
    },
    {
      step: "04",
      title: "Monitor budget pace & download monthly reports",
      description:
        "Watch how spending compares with how far along the month is, spot warning notices when you reach 80% or 100% of a limit, and export clean CSV or Markdown summaries anytime.",
      detail: "Charts, totals, and reports stay automatically in sync across every page.",
    },
  ],
  guaranteesTitle: "Built to keep you in control",
  guaranteesSubtitle: "Clarity and privacy are woven into every step, without requiring you to learn complex settings.",
  guarantees: [
    {
      title: "Nothing saves or deletes silently",
      description:
        "Receipts open a review form first, and delete commands require an explicit click on Confirm before an expense is ever removed.",
    },
    {
      title: "Private, isolated personal records—even in shared groups",
      description:
        "Your personal expenses, private contacts, receipts, budgets, and chat history stay strictly inside your account. Collaborating in a Shared split group never exposes your personal ledger.",
    },
    {
      title: "Switch languages smoothly",
      description:
        "Use the workspace, assistant replies, alerts, and downloadable monthly reports in English or Hindi whenever you prefer.",
    },
  ],
  ctaTitle: "Want to inspect every tool in detail?",
  ctaSubtitle: "Browse all product capabilities on the Features page, or check answers to common questions in our FAQ.",
  readFaq: "Read the FAQ",
}
