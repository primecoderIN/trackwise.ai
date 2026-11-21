// English texts for the public site's navigation, footer, focused home page, legal policies, and contact page.
// Part of app/_public/texts/ (Phase 29).

import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"

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
    features: ROUTES.features,
    security: ROUTES.security,
    faq: ROUTES.faq,
    privacy: ROUTES.privacy,
    terms: ROUTES.terms,
    contact: ROUTES.contact,
  },
  otherPaths: {
    landing: ROUTES.landingHi,
    features: ROUTES.featuresHi,
    security: ROUTES.securityHi,
    faq: ROUTES.faqHi,
    privacy: ROUTES.privacyHi,
    terms: ROUTES.termsHi,
    contact: ROUTES.contactHi,
  },
  nav: {
    features: "Features",
    security: "Security",
    faq: "FAQ",
    contact: "Contact",
    signIn: "Sign in",
    openApp: "Open Dashboard",
  },
  footer: {
    tagline: `${APP_NAME} — AI expense tracking, receipt scanning, budgets, reports, and MCP tools in English and Hindi.`,
    rights: `© 2026 ${APP_NAME}. Built with strict owner isolation and privacy by architecture.`,
    productHeading: "Product",
    trustHeading: "Trust & Help",
    legalHeading: "Legal & Language",
    home: "Home",
    features: "All Features",
    security: "Security & Privacy",
    faq: "FAQ",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    contact: "Contact & Grievance",
    signIn: "Sign in",
    languageLabel: "Switch language",
  },
  landing: {
    title: `${APP_NAME} — AI Expense Tracker, Receipt Scanner & Monthly Budgets`,
    metaDescription:
      "Track daily expenses in INR and foreign currencies, scan receipts with human confirmation, set monthly budgets, and connect MCP clients in English and Hindi.",
    badge: "Bilingual AI Expense Workspace · English & हिन्दी",
    heroTitle: "Track every rupee through conversation, receipts, or calm spreadsheets.",
    heroSubtitle: `${APP_NAME} combines an interactive web workspace, an AI assistant with generative cards, receipt scanning with confirmation, monthly budget pace tracking, and open MCP integration.`,
    getStarted: "Get started",
    openDashboard: "Open Dashboard",
    exploreFeatures: "Explore all features",
    trustStrip: [
      "Zero tokens in browser storage",
      "Per-owner database isolation",
      "Multi-currency INR conversion",
      "Open MCP server included",
    ],
    walkthrough: EN_WALKTHROUGH_TEXTS,
    pillarsTitle: "Everything in one focused financial workspace",
    pillarsSubtitle: "Dedicated tools for daily recording, monthly control, and AI automation—without clutter.",
    pillars: [
      {
        eyebrow: "AI Assistant & Receipts",
        title: "Chat naturally, review forms, approve deletes",
        description:
          "Stream responses with live tool chips, pre-filled A2UI forms, receipt extraction, and mandatory Approve/Cancel delete cards.",
        hrefKey: "features",
        hash: "#assistant",
        linkLabel: "Explore assistant & receipts",
      },
      {
        eyebrow: "Expenses & Multi-Currency",
        title: "Fast ledger in INR and any currency",
        description:
          "Search, filter, sort, inline-edit, and bulk-delete expenses while converting USD, EUR, GBP and more to accurate INR totals.",
        hrefKey: "features",
        hash: "#expenses",
        linkLabel: "See expenses & currency",
      },
      {
        eyebrow: "Budgets, Categories & Reports",
        title: "Pace meters and one-click exports",
        description:
          "Watch category and overall limits against the day of the month, inspect category shares, and export CSV or Markdown reports.",
        hrefKey: "features",
        hash: "#budgets",
        linkLabel: "View budgets & reports",
      },
      {
        eyebrow: "Security by Architecture",
        title: "Strict isolation and zero-token browser sessions",
        description:
          "OpenID Connect cookies stay HttpOnly and server-verified, receipts run tool-less, and external MCP clients use revocable tokens.",
        hrefKey: "security",
        hash: "",
        linkLabel: "Read security architecture",
      },
    ],
    workflowTitle: "Up and running in under a minute",
    workflowSubtitle: "Designed to remove manual busywork while keeping you in complete control.",
    workflowSteps: [
      {
        step: "01",
        title: "Sign in safely & pick your language",
        description:
          "Authenticate through OpenID Connect, choose English or Hindi, and optionally set your first monthly budget.",
      },
      {
        step: "02",
        title: "Record via chat, receipt, web table, or MCP",
        description:
          "Send a message, drop a receipt PDF/photo, edit inline in the ledger, or call tools from Claude Desktop.",
      },
      {
        step: "03",
        title: "Track budget pace & download reports",
        description:
          "Catch 80% budget alerts early, monitor 6-month trends, and export clean CSV or Markdown summaries anytime.",
      },
    ],
    bilingualBannerTitle: "Bilingual by design & ready for external AI clients",
    bilingualBannerSubtitle:
      "Every page, error message, assistant card, and downloadable report switches between English and Hindi—plus connect MCP clients in seconds.",
    bilingualCta: "Inspect all 6 feature areas",
    ctaTitle: "Take control of your monthly spending",
    ctaSubtitle: "Sign in to open your Dashboard, or browse our detailed FAQ to see how every feature works.",
    faqCta: "Read all FAQs",
  },
  privacyPage: {
    title: "Privacy Policy",
    metaDescription: `How ${APP_NAME} collects, uses, protects, and isolates your personal and financial data in accordance with India's Digital Personal Data Protection Act, 2023.`,
    updated: "Last updated: 21 November 2026 · Version 2026-11",
    intro: `${APP_NAME} is built to help you track your personal expenses while keeping your financial data private, isolated to your account, and protected under principles aligned with India's Digital Personal Data Protection Act, 2023 (DPDP Act).`,
    sections: [
      {
        heading: "1. Data We Collect",
        body: "When you sign in through our OpenID Connect identity provider, we store your provider identifier (issuer and subject), display name, email address, and profile picture URL. As you use the app, we store the expenses, monthly budgets, uploaded receipt files, assistant conversation threads, and personal access token hashes you create.",
      },
      {
        heading: "2. Purpose and Use of Your Data",
        body: `Your data is used solely to provide ${APP_NAME}'s features to you: calculating your spending summaries, tracking your budgets, generating your downloadable reports, and answering your requests in the assistant or over MCP. We do not sell your personal or financial data or share it with advertisers.`,
      },
      {
        heading: "3. AI Processing and Uploaded Receipts",
        body: "When you use the AI assistant, natural-language expense parser, or receipt scanner, the relevant text or receipt file is sent to the configured Gemini model with store=False so Google does not keep conversation copies for later retrieval. Uploaded receipts are treated strictly as data and are never saved as expenses until you confirm them.",
      },
      {
        heading: "4. Session Security and Storage",
        body: "Your browser holds only an HttpOnly, Secure session cookie containing a random key. The server stores only the SHA-256 hash of that key and keeps your OIDC ID token encrypted with Fernet keys. No session token or personal financial data is persisted in browser localStorage.",
      },
      {
        heading: "5. Your Rights Under the DPDP Act, 2023",
        body: "You have the right to access your personal data, correct inaccurate expenses or profile details, revoke active sessions and personal access tokens at any time from Settings, and request erasure or raise a grievance through our Contact & Grievance channel.",
      },
    ],
  },
  termsPage: {
    title: "Terms of Service",
    metaDescription: `Terms of Service governing your use of ${APP_NAME}.`,
    updated: "Last updated: 21 November 2026 · Version 2026-11",
    intro: `By signing in to and using ${APP_NAME}, you agree to these Terms of Service. Please read them carefully.`,
    sections: [
      {
        heading: "1. Your Account and Sessions",
        body: "You sign in using your identity provider account. You are responsible for keeping your signed-in devices and any personal access tokens you generate in Settings → Developer secure. You can revoke any browser session or access token at any time.",
      },
      {
        heading: "2. Financial Information Disclaimer",
        body: `${APP_NAME} is a personal expense tracking and budgeting tool. Summaries, currency conversions, and AI assistant insights are provided for your informational convenience and do not constitute professional tax, legal, or financial advice.`,
      },
      {
        heading: "3. Acceptable Use and Quotas",
        body: "To keep the service reliable and protect language-model quota, automated endpoints (including assistant runs, receipt uploads, report generation, and MCP requests) enforce per-account rate limits and file size limits. You agree not to attempt to bypass authentication, CSRF protections, or rate limits.",
      },
      {
        heading: "4. Availability and Changes",
        body: `We continually improve ${APP_NAME} and may update features, limits, or these terms. When a material update to the terms occurs, we will ask you to review and accept the new version in the app.`,
      },
    ],
  },
  contactPage: {
    title: "Contact & Grievance Redressal",
    metaDescription: `Support and Data Protection Grievance contact details for ${APP_NAME}.`,
    intro: `Have a question about ${APP_NAME}, need help with your account, or wish to exercise your rights under the Digital Personal Data Protection Act, 2023? Reach us directly below.`,
    supportHeading: "General Support",
    supportBody: "For questions about features, bug reports, or account assistance:",
    supportEmail: "support@trackwise.ai",
    grievanceHeading: "Data Protection & Grievance Officer",
    grievanceBody:
      "For privacy inquiries, data access or deletion requests, or grievances under India's Digital Personal Data Protection Act, 2023:",
    grievanceEmail: "privacy-grievance@trackwise.ai",
    responseNote:
      "We acknowledge all privacy and grievance requests promptly and aim to resolve them within statutory timelines.",
  },
}
