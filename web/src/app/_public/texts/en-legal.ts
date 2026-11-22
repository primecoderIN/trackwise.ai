// Retained English legal documents (`/privacy-policy` and `/terms-of-service`) rewritten for a global audience
// in plain, non-technical language. Accessible from onboarding consent and sign-in, outside marketing navigation.

import { APP_NAME } from "@/shared/config/app"

import type { LegalPageTexts } from "./types"

/** English Privacy Policy texts (`/privacy-policy`). */
export const EN_PRIVACY_TEXTS: LegalPageTexts = {
  title: "Privacy Policy",
  metaDescription: `How ${APP_NAME} collects, uses, and protects your personal and expense data worldwide.`,
  updated: "Last updated: 22 November 2026 · Version 2026-11",
  intro: `${APP_NAME} is built to help you track personal expenses while keeping your financial information private, separated inside your account, and protected with clear safeguards.`,
  sections: [
    {
      heading: "1. Information We Collect",
      body: "When you sign in with a supported identity provider, we store the account identifier, display name, email address, and profile image link needed to recognize your account. As you use the app, we store the expenses, monthly budgets, uploaded receipt files, assistant conversations, and optional app access tokens you create.",
    },
    {
      heading: "2. How We Use Your Data",
      body: `Your information is used strictly to provide ${APP_NAME}: calculating spending summaries, tracking monthly budgets, generating downloadable reports, and answering your requests in the assistant. We do not sell your personal or financial data or share it with advertisers.`,
    },
    {
      heading: "3. AI Features and Uploaded Receipts",
      body: "When you send a chat message or upload a receipt image or PDF, only the relevant input is processed by our configured AI service to extract expense fields or answer your question. AI requests are configured not to keep conversation copies for later retrieval, and scanned receipts are never saved as expenses until you review and confirm them.",
    },
    {
      heading: "4. Account Sessions and Browser Privacy",
      body: "Your signed-in session is managed securely on our server rather than exposing account credentials or expense records in browser storage. You can inspect active browsers and sign out remotely from any device in Settings at any time.",
    },
    {
      heading: "5. Your Data Rights and Contact",
      body: "Wherever you live, you can view and edit your expenses, review or revoke active sessions and access tokens in Settings, and contact us at privacy@trackwise.ai to request data access, correction, or account deletion.",
    },
  ],
}

/** English Terms of Service texts (`/terms-of-service`). */
export const EN_TERMS_TEXTS: LegalPageTexts = {
  title: "Terms of Service",
  metaDescription: `Terms of Service governing your use of ${APP_NAME}.`,
  updated: "Last updated: 22 November 2026 · Version 2026-11",
  intro: `By signing in to and using ${APP_NAME}, you agree to these Terms of Service. Please read them carefully.`,
  sections: [
    {
      heading: "1. Your Account and Access",
      body: "You sign in through your chosen account provider. You are responsible for keeping your signed-in devices and any access tokens you create in Settings secure, and you can revoke any active browser session or token at any time.",
    },
    {
      heading: "2. Informational Purpose Only",
      body: `${APP_NAME} is a personal expense tracking and budgeting tool. Spending summaries, category breakdowns, currency conversions, and AI-generated insights are provided for convenience and do not constitute professional tax, legal, accounting, or financial advice.`,
    },
    {
      heading: "3. Acceptable Use and Service Limits",
      body: "To keep the service reliable for everyone, automated and AI-powered actions (such as chat assistant runs, receipt uploads, and report exports) include fair usage and file size limits. You agree not to misuse the service or attempt to bypass access controls or usage limits.",
    },
    {
      heading: "4. Service Updates and Changes to Terms",
      body: `We continuously improve ${APP_NAME} and may update features, limits, or these terms over time. When a material change is made to these terms, you will be asked to review and accept the updated version inside the app.`,
    },
  ],
}
