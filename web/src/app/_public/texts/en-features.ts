// English texts for the dedicated `/features` showcase page (6 core areas + consumer capability matrix).
// Uses global neutral examples ($ / EUR) and plain consumer language. Part of app/_public/texts/.

import { APP_NAME } from "@/shared/config/app"

import type { FeaturesPageTexts } from "./types"

/** English texts for `/features`. */
export const EN_FEATURES_TEXTS: FeaturesPageTexts = {
  title: "Features — AI Assistant, Receipt Scanning, Budgets & Reports",
  metaDescription: `Explore ${APP_NAME} capabilities: AI expense chat with interactive forms and delete confirmations, receipt scanning, global currency logging, budget pace meters, and CSV/Markdown exports.`,
  keywords: [
    "AI expense assistant",
    "receipt scanner features",
    "monthly budget pace tracker",
    "expense CSV export",
    APP_NAME,
  ],
  heroBadge: "Product Features",
  heroTitle: "Every tool to record, understand, and control your spending.",
  heroSubtitle:
    "Type expenses in plain words, drop receipt photos, filter clean ledgers, or track monthly caps—with clear previews and confirmations at every step.",
  getStarted: "Get started",
  openDashboard: "Open Dashboard",
  readFaq: "Read the FAQ",
  sections: [
    {
      id: "assistant",
      badge: "AI Chat Assistant",
      title: "Conversational Expense Assistant with Guided Forms & Approvals",
      summary:
        "Chat from any workspace page in a side panel (or slide-over sheet on mobile). Ask questions, see visual spending breakdowns, and confirm actions safely.",
      highlights: [
        "Log spending naturally in plain text (“Paid $18.50 at Corner Cafe by card”) and ask about monthly trends",
        "When details are missing, the assistant opens a pre-filled interactive form so you can finish it cleanly",
        "Visual insight cards show spending charts, category shares, and comparisons against the previous month",
        "Deleting an expense from chat always pauses for an explicit Confirm / Cancel card first",
      ],
      previewKind: "assistant",
    },
    {
      id: "receipts",
      badge: "Receipt Scanning",
      title: "Upload Receipt Photos or PDFs—Review Before Saving",
      summary: `Attach a JPEG, PNG, WEBP, or PDF receipt (up to 5 MB) right inside chat. ${APP_NAME} extracts key purchase details into an editable review card.`,
      highlights: [
        "Supports common photo and PDF receipt formats up to 5 MB directly from desktop or phone",
        "Verified upload checks keep files isolated to your account and treat receipt text strictly as data",
        "Automatically fills merchant, amount, currency code, date, category, and payment method for review",
        "Nothing scanned from a bill is ever added to your ledger until you verify and press Save",
      ],
      previewKind: "receipts",
    },
    {
      id: "expenses",
      badge: "Expenses & Currencies",
      title: "Fast Expenses Ledger with Global Currency Entries",
      summary:
        "Manage every purchase in a searchable, sortable table with date filters, quick inline edits, and support for recording expenses across everyday world currencies.",
      highlights: [
        "Filter by merchant name, notes, spending category, and custom date ranges, plus column sorting",
        "Add expenses quickly in a dialog, edit rows inline, or remove selected rows with confirmation",
        "Record purchases with standard 3-letter currency codes such as USD, EUR, GBP, and more",
        "Editing descriptive details like merchant, category, or notes keeps original payment amounts intact",
      ],
      previewKind: "expenses",
    },
    {
      id: "budgets",
      badge: "Budgets & Categories",
      title: "Monthly Budgets, Pace Tracking & Category Breakdown",
      summary:
        "Set one overall monthly cap and limits per category. Step across months, track daily pace, and catch spending alerts right as you save.",
      highlights: [
        "Overall budget bar marks how far along the month is so you see pace at a glance",
        "Clear color-coded states: On Track, Near the Limit (at 80%), and Over the Limit (at 100%)",
        "Instant alert notices appear when adding or updating an expense pushes a budget to 80% or 100%",
        "Dedicated Categories overview shows category icons, monthly totals, counts, and spending shares",
      ],
      previewKind: "budgets",
    },
    {
      id: "reports",
      badge: "Reports & Exports",
      title: "Monthly Spending Reports with Clean CSV & Markdown Exports",
      summary:
        "Review complete monthly figures on the Reports page or directly inside chat summaries, ready to download in your preferred language.",
      highlights: [
        "See month-over-month percentage change, daily average across active days, and top 5 biggest expenses",
        "Inspect clean breakdowns by spending category and payment method with percentage shares",
        "One-click CSV spreadsheet download formatted cleanly for Excel, Google Sheets, and accounting tools",
        "Clean Markdown summary export localized in English or Hindi for notes and archiving",
      ],
      previewKind: "reports",
    },
    {
      id: "workspace",
      badge: "Productivity & Control",
      title: "Keyboard Command Search, Languages & Session Security",
      summary:
        "Move fast across pages, switch smoothly between English and Hindi, customize appearance, and manage your signed-in browsers in Settings.",
      highlights: [
        "Press Ctrl/⌘ + K anywhere in the app to jump to any page, start a new expense, or open chat",
        "Full English and Hindi interface across pages, budget alerts, assistant replies, and exports",
        "Organized Settings for Profile, Preferences (language and light/dark theme), and active browser sessions",
        "View active devices and sign out other browsers remotely anytime—plus optional app tokens",
      ],
      previewKind: "workspace",
    },
  ],
  previewData: {
    assistantHeader: "Confirmation Before Deleting",
    assistantUser: "Delete the Corner Cafe expense",
    assistantChip: "Found entry · Waiting for confirmation",
    assistantApprovalTitle: "Delete this expense?",
    assistantApprovalMeta: "Corner Cafe · $18.50 · 14 Nov 2026",
    assistantApprove: "Confirm",
    assistantCancel: "Cancel",
    receiptBadge: "JPEG / PNG / WEBP / PDF · ≤ 5 MB",
    receiptMerchant: "Merchant: Morning Roast Coffee",
    receiptAmount: "Total: $14.50 (USD)",
    receiptCategory: "Category: Food",
    receiptPayment: "Payment: Card",
    receiptConfirm: "Review & Save Expense",
    expensesSearchPlaceholder: "Search merchant or note…",
    expensesPrimaryTitle: "Cloud Hosting · Tools",
    expensesPrimaryAmount: "€24.00 EUR",
    expensesPrimaryNote: "Original currency preserved",
    expensesSecondaryNote: "Tag purchases in USD, EUR, GBP, and more alongside clean search & date filters",
    budgetOverallLabel: "Food Budget · November",
    budgetOverallValue: "$425 / $500",
    budgetPaceNote: "85% used · Near the limit",
    budgetAlertNote: "Budget alert: Food reached 80% of monthly limit",
    reportMonth: "Monthly Report · November 2026",
    reportDelta: "-12.4% vs October",
    reportDailyAvg: "Daily avg: $38.50 across 21 days",
    reportCsvLabel: "trackwise-2026-11.csv",
    reportMdLabel: "trackwise-2026-11.md",
    workspaceHeader: "Workspace Controls & Languages",
    workspaceShortcutLabel: "Ctrl + K · Jump anywhere",
    workspaceSessionNote: "Active browsers · Remote sign-out available in Settings",
    workspaceItems: ["English", "हिन्दी", "Light / Dark theme", "CSV & Markdown export"],
  },
  matrixTitle: "Choose the workflow that fits each moment",
  matrixSubtitle:
    "Whether you use the web workspace, chat assistant, or receipt uploads, every action follows the exact same safeguards and keeps your data in sync.",
  matrixHeaders: {
    capability: "What you can do",
    webApp: "Web Workspace",
    assistant: "AI Chat Assistant",
    receipts: "Receipt Upload",
  },
  matrixRows: [
    {
      capability: "Record & update expenses",
      webApp: "Quick Add dialog & inline table edits",
      assistant: "Plain-text chat or pre-filled review form",
      receipts: "Extracts merchant, amount, currency & date to review",
    },
    {
      capability: "Protection before deleting",
      webApp: "Explicit delete confirmation modal",
      assistant: "Mandatory Confirm / Cancel card before removal",
      receipts: "Never saves or removes data automatically",
    },
    {
      capability: "Budgets & spending warnings",
      webApp: "Pace bars, elapsed-time markers & edit dialogs",
      assistant: "Budget status cards & threshold warnings",
      receipts: "Triggers 80% / 100% notices once confirmed",
    },
    {
      capability: "Monthly reports & exports",
      webApp: "Full monthly breakdown + CSV / MD download",
      assistant: "Insight summary card + download buttons",
      receipts: "Confirmed bills flow into monthly totals",
    },
  ],
  ctaTitle: `Ready to see ${APP_NAME} step by step?`,
  ctaSubtitle: "Walk through how daily tracking works from sign-in to export, or jump straight in.",
  howItWorksCta: "See How It Works",
}
