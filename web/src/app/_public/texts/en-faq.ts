// English texts for the dedicated `/faq` page covering workflows, features, currencies, and privacy safeguards.
// Rewritten without engineering jargon or India-only framing. Part of app/_public/texts/.

import { APP_NAME } from "@/shared/config/app"

import type { FaqPageTexts } from "./types"

/** English texts for `/faq`. */
export const EN_FAQ_TEXTS: FaqPageTexts = {
  title: "Frequently Asked Questions",
  metaDescription: `Clear answers about ${APP_NAME}: passwordless sign-in, AI expense logging, Personal & Shared bill splitting with UPI QR codes, receipt scanning, global currencies, monthly budgets, reports, and data privacy.`,
  keywords: [
    "expense tracker FAQ",
    "bill splitting FAQ",
    "UPI QR split expenses",
    "receipt scanner questions",
    "AI expense tracker privacy",
    "monthly budget app help",
    APP_NAME,
  ],
  heroBadge: "Help & Answers",
  heroTitle: `Frequently asked questions about ${APP_NAME}`,
  heroSubtitle:
    "Plain-language answers on getting started, daily chat tracking, bill splitting & shared groups, receipt uploads, budgets, exports, and how your personal data stays protected.",
  categories: [
    {
      id: "getting-started",
      title: "Getting Started & Account Access",
      description: "Signing in, first-time setup, and managing your signed-in browsers.",
      items: [
        {
          question: `How do I sign in to ${APP_NAME}?`,
          answer: `${APP_NAME} uses passwordless sign-in through trusted identity providers rather than asking you to create another password. Click Sign in, verify with your provider, and our server sets a secure private session for your browser.`,
        },
        {
          question: "What happens during the first-time welcome setup?",
          answer:
            "On your first sign-in (or when legal terms are updated), a quick welcome dialog lets you choose English or Hindi, select your default currency and timezone, optionally set an overall monthly budget or try a starter assistant prompt, and confirm the current terms.",
        },
        {
          question: "How can I check or sign out other devices logged into my account?",
          answer:
            "Open Settings → Security. You can review every active browser signed in to your account with its device label and recent activity, sign out a single browser, or sign out everywhere else with one click.",
        },
      ],
    },
    {
      id: "assistant-approvals",
      title: "AI Assistant & Confirmations",
      description: "Chat logging, interactive review forms, and delete protection.",
      items: [
        {
          question: "Can the AI assistant delete my expenses without asking me?",
          answer:
            "Never. When you ask the assistant to remove an expense, it displays a confirmation card showing the merchant, amount, and date. Nothing is deleted until you explicitly click Confirm.",
        },
        {
          question: "What happens if my message leaves out details like payment method or date?",
          answer:
            "Instead of guessing missing details, the assistant presents a pre-filled interactive form containing what it understood so you can adjust or complete the fields and press Save.",
        },
        {
          question: "Does my chat conversation stay open as I move between pages?",
          answer:
            "Yes. The assistant stays docked inside the workspace as you navigate between Dashboard, Expenses, Splits, Budgets, Categories, and Reports until you start a new conversation or sign out.",
        },
      ],
    },
    {
      id: "receipt-scanning",
      title: "Receipt Scanning",
      description: "Supported formats, file limits, and reviewing extracted bills.",
      items: [
        {
          question: "Which receipt file types and sizes are supported?",
          answer:
            "You can upload JPEG, PNG, and WEBP photos as well as PDF files up to 5 MB using the attach button in the chat box.",
        },
        {
          question: "Are scanned receipts saved straight into my expense table?",
          answer: `No. ${APP_NAME} reads the merchant, amount, currency, date, category, and payment method into an editable review form first. Nothing is recorded until you verify the details and click Save.`,
        },
        {
          question: "What if a receipt contains confusing or unusual text?",
          answer:
            "Uploaded receipts are read solely to extract purchase fields as passive data. Text printed on a bill can never trigger commands or change your saved expenses.",
        },
      ],
    },
    {
      id: "expenses-currency",
      title: "Expenses, Categories & Currencies",
      description: "Recording global currencies, editing rows, and spending categories.",
      items: [
        {
          question: "Can I log expenses in multiple currencies?",
          answer:
            "Yes. When adding or editing an expense, you can tag purchases with standard 3-letter currency codes such as USD, EUR, GBP, and others so your ledger keeps the original currency and amount you spent. Unified monthly totals currently combine into one shared workspace currency rather than pulling live market exchange rates.",
        },
        {
          question: "What happens when I edit an expense's merchant name or note?",
          answer:
            "Updating descriptive details such as the merchant, category, payment method, or note keeps your saved amount and currency information intact.",
        },
        {
          question: "Which spending categories are included?",
          answer: `${APP_NAME} comes with 8 built-in categories (Food, Transport, Shopping, Bills, Entertainment, Health, Travel, and Other) visible on the Categories page with monthly totals and expense counts.`,
        },
      ],
    },
    {
      id: "splits-groups",
      title: "Splits, Shared Groups & UPI Links",
      description:
        "Personal vs. Shared groups, invite links, per-group balances, settlements, and INR UPI QR shortcuts.",
      items: [
        {
          question: "What is the difference between direct splits, Personal groups, and Shared groups?",
          answer:
            "Direct splits track 1-on-1 IOUs with your private contacts. Personal groups let you organize a trip or household by yourself with private contacts or placeholder guests. Shared groups let invited members sign in and collaborate on the same group ledger—and you can upgrade a Personal group to a Shared group anytime.",
        },
        {
          question: "How do invite links and guest seats work without sharing email addresses?",
          answer:
            "A Shared group owner can create a time-limited, revocable invite link—either an open link or one assigned to a specific guest seat you already used in past splits. When your friend signs in and opens the link, they claim that seat and inherit all historical splits automatically, with zero email lookup required.",
        },
        {
          question: "Why are balances kept separate for each group and currency?",
          answer:
            "If Ravi owes you ₹2,000 in Goa Trip and you owe Ravi ₹1,500 in Office Lunch, those are separate obligations that are usually settled independently. Keeping every group and every currency isolated prevents misleading cross-group netting, while your Splits overview shows clear per-currency directional totals.",
        },
        {
          question: "When I join a Shared group, can other members see my personal expenses or private contacts?",
          answer:
            "Never. Personal expenses, private contacts, budgets, receipts, and chats remain strictly private to your account. When you click Record my share on a split, only your own share is added to your personal Expenses ledger, and the link stays completely invisible to other group members.",
        },
        {
          question: "How do settlements, editing locks, and INR UPI QR codes work?",
          answer:
            "Recording a settlement reduces balances cleanly and locks earlier splits in that currency from silent financial edits (you can still edit notes, or soft-void a mistaken settlement with an audit trail). For INR balances, you can optionally save your UPI ID and choose whether to share it with Shared groups; UPI QR codes are payment shortcuts only—always verify recipient details in your UPI app and record the settlement afterward.",
        },
      ],
    },
    {
      id: "budgets-reports",
      title: "Budgets & Monthly Reports",
      description: "Spending limits, pace bars, warning alerts, and clean downloads.",
      items: [
        {
          question: "How do monthly overall and category budgets work?",
          answer:
            "Your overall and category monthly limits carry forward cleanly across months until you adjust or remove them. On the Budgets page, you can step backward or forward month by month to compare past spending against your goals.",
        },
        {
          question: "When do budget warning alerts trigger?",
          answer:
            "Budgets show On Track under 80%, Near the Limit between 80% and 99.9%, and Over the Limit at 100% or higher. Whenever saving or updating an expense pushes a budget across 80% or 100%, an instant alert appears.",
        },
        {
          question: "What do Monthly Reports include and how can I export them?",
          answer:
            "Reports show your total spending compared with the previous month, daily averages, category and payment-method shares, and your top 5 largest purchases. You can download any month as a clean CSV spreadsheet or Markdown summary in English or Hindi.",
        },
      ],
    },
    {
      id: "privacy-security-languages",
      title: "Privacy, Security & Languages",
      description: "Account separation, browser storage safety, AI data handling, and bilingual support.",
      items: [
        {
          question: `How does ${APP_NAME} keep my personal financial data separate and secure?`,
          answer:
            "Every personal expense, budget, private contact, receipt upload, and conversation belongs strictly to your authenticated account on the server. Even when you collaborate inside a Shared split group, only active members see that group's shared splits and settlements—never your personal ledger.",
        },
        {
          question: `Does ${APP_NAME} store sensitive credentials or expense records in my browser?`,
          answer:
            "No. Account credentials and financial data are never kept in browser local storage. Signing out or switching accounts clears the active workspace immediately.",
        },
        {
          question: "How are chat messages and receipts handled by AI?",
          answer:
            "Only the text or receipt file you explicitly send is processed to complete your request. AI requests are configured so conversation copies are not stored for later retrieval, and your personal financial records are never sold or shared with advertisers.",
        },
        {
          question: "Are English and Hindi available throughout the app?",
          answer:
            "Yes. Every public page, workspace screen, budget alert, assistant reply, and downloadable monthly report works smoothly in both English and Hindi (हिन्दी), and you can switch anytime in Settings or the public navigation.",
        },
      ],
    },
  ],
  ctaTitle: "Still have a question?",
  ctaSubtitle: "Reach out to our global support team or walk through how every step works.",
  contactCta: "Contact support",
  featuresCta: "Explore all features",
}
