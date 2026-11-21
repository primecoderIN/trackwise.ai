// English texts for the dedicated `/features` showcase page (all 6 core SpendWise areas + capability matrix).
// Part of app/_public/texts/ (Phase 29).

import { APP_NAME } from "@/shared/config/app"

import type { FeaturesPageTexts } from "./types"

/** English texts for `/features`. */
export const EN_FEATURES_TEXTS: FeaturesPageTexts = {
  title: "Features — AI Assistant, Receipt Scanning, Budgets, Reports & MCP",
  metaDescription: `Explore every ${APP_NAME} capability: streaming AG-UI assistant, A2UI forms and Approve/Cancel cards, receipt scanning, multi-currency INR conversion, budgets, reports, and MCP.`,
  heroBadge: "Complete Product Tour",
  heroTitle: "Every tool to record, understand, and control your money.",
  heroSubtitle:
    "Whether you prefer typing in plain language, dropping receipt photos, filtering tables, or connecting Claude Desktop over MCP—every interface enforces the exact same business rules.",
  getStarted: "Get started",
  openDashboard: "Open Dashboard",
  readFaq: "Read the FAQ",
  sections: [
    {
      id: "assistant",
      badge: "AG-UI + A2UI Protocol",
      title: "Conversational AI Assistant with Interactive Cards & Approvals",
      summary:
        "Chat from any signed-in page in a persistent side panel (or slide-in sheet on mobile). Replies stream live over Server-Sent Events with real-time tool progress chips, structured charts, and mandatory safety approvals.",
      highlights: [
        "Natural-language expense logging (“Paid 450 on Swiggy via UPI”) and trend insights",
        "When fields are missing, the assistant renders a pre-filled A2UI form (`show_expense_form`) instead of guessing",
        "Visual Insight cards with Recharts donut charts, month-over-month deltas, and expense list cards showing #IDs",
        "Deletes always open an Approve / Cancel card locked to that exact expense version (15-minute expiry, zero model quota spent on clicks)",
      ],
      previewKind: "assistant",
    },
    {
      id: "receipts",
      badge: "Dedicated Receipt Agent (A2A)",
      title: "Upload Receipt Photos or PDFs—Review Before Saving",
      summary: `Attach a JPEG, PNG, WEBP, or PDF receipt (up to 5 MB) straight in the chat composer. ${APP_NAME} validates file magic bytes and hands the bytes to a dedicated tool-less Receipt Agent.`,
      highlights: [
        "File type determined by magic bytes, never filename or Content-Type, stored under opaque UUID storage keys",
        "Tool-less JSON schema extraction prevents text printed inside a bill from executing instructions",
        "Extracts merchant, amount, currency, date, category, and payment method into an editable A2UI review form",
        "Nothing read from a receipt is ever written to your ledger until you review and press Save",
      ],
      previewKind: "receipts",
    },
    {
      id: "expenses",
      badge: "Web Ledger & Currency Agent",
      title: "Full Expenses Workspace & Multi-Currency INR Conversion",
      summary:
        "Manage every transaction in a fast, sortable ledger backed by server-side search, filtering, and pagination—complete with foreign-currency support anchored in INR totals.",
      highlights: [
        "Server-side filters for merchant/note search, category, and custom date ranges, plus client-side column sorting",
        "Quick Add Expense modal, inline single-row editing, and bulk multi-select delete with explicit confirmation",
        "Enter expenses in any 3-letter ISO currency (USD, EUR, GBP, etc.); converts and stores exact INR paise (`base_amount_minor`) + rate + rate date",
        "Editing non-monetary details (merchant, category, payment method, note) preserves the original historical exchange rate",
      ],
      previewKind: "expenses",
    },
    {
      id: "budgets",
      badge: "Budgets & Categories",
      title: "Monthly Budgets, Elapsed-Time Pace & Category Breakdown",
      summary:
        "Set one overall monthly cap and per-category limits. Step through months, track daily pace, receive save alerts, and explore every shared category on its own page.",
      highlights: [
        "Overall budget meter includes a vertical time-elapsed marker (`Today: X% of the month`) so pace is unmistakable",
        "Automatic color-coded thresholds: On Track, Near the Limit (≥ 80%), and Over the Limit (≥ 100%)",
        "Real-time SaveWatcher notices toast immediately when a new or updated expense crosses 80% or 100%",
        "Dedicated Categories view (`/categories`) showing icons, monthly spend totals, expense counts, and % share per category",
      ],
      previewKind: "budgets",
    },
    {
      id: "reports",
      badge: "Sandboxed Skill & Safe Exports",
      title: "Monthly Financial Reports with CSV & Markdown Downloads",
      summary:
        "Inspect complete monthly figures calculated by a sandboxed report script—either on the dedicated Reports page (`/reports`) or inside assistant chat cards.",
      highlights: [
        "Month-over-month spend percentage change, daily average across active days, and top 5 biggest expenses",
        "Breakdowns by category and by payment method (UPI, Card, Cash, Netbanking, Wallet, Other) with share percentages",
        "One-click CSV export sanitized against spreadsheet formula injection (`=`, `+`, `-`, `@`)",
        "Clean Markdown (`.md`) summary export with escaped merchant markup, localized in English or Hindi",
      ],
      previewKind: "reports",
    },
    {
      id: "mcp",
      badge: "Productivity, Languages & Open Protocols",
      title: "Command Palette, Bilingual UI, Settings & MCP Integration",
      summary: `Move fast with keyboard shortcuts, switch between English and Hindi seamlessly, manage active browser sessions, and connect external AI tools through ${APP_NAME}'s MCP server.`,
      highlights: [
        "`Ctrl/⌘ + K` command palette jumps to any page, launches New Expense, or toggles the assistant",
        "Complete English & Hindi (`हिन्दी`) localization across pages, error details, reports, assistant cards, and CLDR formatting",
        "Tabbed Settings: Profile (with terms history), Preferences, Security (live browser sessions & remote sign-out), and Developer tokens",
        "Built-in Model Context Protocol server over `/mcp/` HTTP (with Bearer PAT) and `mcp_stdio.py` (for Claude Desktop & MCP Inspector)",
      ],
      previewKind: "mcp",
    },
  ],
  previewData: {
    assistantHeader: "Human-in-the-Loop Delete Gate",
    assistantUser: "Delete expense #14",
    assistantChip: "Checking #14 · Waiting for approval",
    assistantApprovalTitle: "Delete this expense? (#14)",
    assistantApprovalMeta: "Swiggy · ₹450.00 · 14 Nov 2026 · v2",
    assistantApprove: "Approve",
    assistantCancel: "Cancel",
    receiptBadge: "JPEG / PNG / WEBP / PDF · ≤ 5 MB",
    receiptMerchant: "Merchant: Blue Tokai Coffee",
    receiptAmount: "Total: ₹340.00 (INR)",
    receiptCategory: "Category: Food",
    receiptPayment: "Payment: UPI",
    receiptConfirm: "Review & Save Expense",
    expensesSearchPlaceholder: "Search merchant or note…",
    expensesCurrencyOrig: "$12.00 USD",
    expensesCurrencyInr: "≈ ₹1,014.00",
    expensesRateNote: "1 USD = 84.50 INR (rate preserved on note edits)",
    budgetOverallLabel: "Food Budget · November",
    budgetOverallValue: "₹6,800 / ₹8,000",
    budgetPaceNote: "85% used · Near the limit",
    budgetAlertNote: "Save notice: Food crossed 80% of monthly limit",
    reportMonth: "Monthly Report · November 2026",
    reportDelta: "-12.4% vs October",
    reportDailyAvg: "Daily avg: ₹920.00 across 21 days",
    reportCsvLabel: "trackwise-2026-11.csv",
    reportMdLabel: "trackwise-2026-11.md",
    mcpHeader: "MCP Server (`/mcp/` & stdio)",
    mcpTokenLabel: "Token: spw_••••••••••••x9Qa (SHA-256 stored)",
    mcpShortcutLabel: "Ctrl + K · Jump anywhere",
    mcpToolsList: ["add_expense", "list_expenses", "get_summary", "get_budgets", "set_budget", "get_monthly_report"],
  },
  matrixTitle: "Every surface shares the same source of truth",
  matrixSubtitle:
    "Whether a change comes from the web UI, the conversational assistant, or an external MCP client, it runs through one CQRS command bus and one owner check.",
  matrixHeaders: {
    capability: "Capability",
    webApp: "Web Workspace",
    assistant: "AI Assistant Panel",
    mcp: "External MCP Clients",
  },
  matrixRows: [
    {
      capability: "Add & update expenses (multi-currency)",
      webApp: "Dialog & inline table editing",
      assistant: "Natural language or A2UI form",
      mcp: "`add_expense` / `update_expense`",
    },
    {
      capability: "Delete protection",
      webApp: "Explicit confirmation modal",
      assistant: "Mandatory Approve / Cancel card",
      mcp: "`confirmed: true` boolean interlock",
    },
    {
      capability: "Receipt extraction",
      webApp: "Upload via chat attachment",
      assistant: "ReceiptAgent -> pre-filled review form",
      mcp: "Not exposed externally",
    },
    {
      capability: "Budgets & threshold alerts",
      webApp: "Meters, pace marker & dialogs",
      assistant: "Budget status card & save notices",
      mcp: "`get_budgets` / `set_budget`",
    },
    {
      capability: "Monthly reports & exports",
      webApp: "Full report view + CSV / MD download",
      assistant: "Summary card + instant download buttons",
      mcp: "`get_monthly_report`",
    },
  ],
  ctaTitle: `Ready to explore ${APP_NAME} firsthand?`,
  ctaSubtitle: "Sign in to start tracking, or read how we protect every byte on the Security page.",
}
