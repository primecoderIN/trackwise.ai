// Retained English legal documents (`/privacy-policy` and `/terms-of-service`) rewritten for a global audience
// in plain, non-technical language. Accessible from onboarding consent and sign-in, outside marketing navigation.

import { ACCOUNT } from "@/shared/api/contracts.gen"
import { APP_NAME } from "@/shared/config/app"

import type { LegalPageTexts } from "./types"

const UPDATED_LABEL = `Last updated: 27 November 2026 · Version ${ACCOUNT.currentTermsVersion}`

/** English Privacy Policy texts (`/privacy-policy`). */
export const EN_PRIVACY_TEXTS: LegalPageTexts = {
  title: "Privacy Policy",
  metaDescription: `How ${APP_NAME} collects, uses, and protects your personal, expense, and shared-split data worldwide.`,
  updated: UPDATED_LABEL,
  intro: `${APP_NAME} is built to help you track personal expenses and split shared bills while keeping your personal financial records private, isolated inside your account, and protected with clear safeguards.`,
  sections: [
    {
      heading: "1. Information We Collect",
      body: "When you sign in with a supported identity provider, we store the account identifier, display name, email address, and profile image link needed to recognize your account. As you use the app, we store your account preferences (language, default currency, and timezone), personal expenses, monthly budgets, uploaded receipt files, assistant conversations, optional app access tokens, and Splits records (your private contacts, Personal and Shared group memberships, split expenses, settlements, private personal-expense links, and any optional UPI ID and group-sharing preference you save).",
    },
    {
      heading: "2. How We Use Your Data",
      body: `Your information is used strictly to provide ${APP_NAME}: calculating spending summaries, tracking monthly budgets, computing isolated per-group and direct split balances, generating downloadable reports, and answering your requests in the assistant. We do not sell your personal or financial data or share it with advertisers.`,
    },
    {
      heading: "3. AI Features and Uploaded Receipts",
      body: "When you send a chat message or upload a receipt image or PDF, only the relevant input is processed by our configured AI service to extract expense fields or answer your question. AI requests are configured not to keep conversation copies for later retrieval, and scanned receipts are never saved as expenses until you review and confirm them.",
    },
    {
      heading: "4. Shared Split Groups and Opt-In Sharing",
      body: "When you join a Shared split group via an invite link, active members of that group can see your display name and the splits, shares, and settlements recorded in that group. Your personal expenses, private contacts, private contact UPI IDs, budgets, uploaded receipts, chat history, and private links to your personal Expenses ledger are never visible to other group members. Your own optional UPI ID is hidden from Shared groups by default and is shown to co-members only if you explicitly enable group sharing; turning it off removes it immediately.",
    },
    {
      heading: "5. Account Sessions and Browser Privacy",
      body: "Your signed-in session is managed securely on our server rather than exposing account credentials or expense records in browser storage. You can inspect active browsers and sign out remotely from any device in Settings at any time.",
    },
    {
      heading: "6. Your Data Rights and Contact",
      body: "Wherever you live, you can view and edit your expenses, manage your split groups and UPI sharing preference, review or revoke active sessions and access tokens in Settings, and contact us at privacy@trackwise.ai to request data access, correction, or account deletion.",
    },
  ],
}

/** English Terms of Service texts (`/terms-of-service`). */
export const EN_TERMS_TEXTS: LegalPageTexts = {
  title: "Terms of Service",
  metaDescription: `Terms of Service governing your use of ${APP_NAME}.`,
  updated: UPDATED_LABEL,
  intro: `By signing in to and using ${APP_NAME}, you agree to these Terms of Service. Please read them carefully.`,
  sections: [
    {
      heading: "1. Your Account and Access",
      body: "You sign in through your chosen account provider. You are responsible for keeping your signed-in devices, any access tokens you create in Settings, and any Shared group invite links you generate secure. You can revoke active browser sessions, access tokens, or group invite links at any time.",
    },
    {
      heading: "2. Informational Purpose Only & Payment Links",
      body: `${APP_NAME} is a personal expense tracking, budgeting, and bill-splitting tool. Spending summaries, split balances, simplified transfer suggestions, currency conversions, and AI-generated insights are provided for convenience and do not constitute professional tax, legal, accounting, or financial advice. INR UPI links and QR codes are convenience shortcuts only: ${APP_NAME} does not process, verify, or confirm bank or UPI payments, and syntax checks do not verify bank-account ownership. You are responsible for verifying the recipient and amount in your payment app before paying and for recording settlements manually.`,
    },
    {
      heading: "3. Acceptable Use and Service Limits",
      body: "To keep the service reliable and safe for everyone, automated, collaborative, and AI-powered actions (such as chat assistant runs, receipt uploads, report exports, and shared-group invite lookups) include fair usage, rate, and file size limits. You agree not to misuse the service or attempt to bypass access controls, group permissions, or usage limits.",
    },
    {
      heading: "4. Service Updates and Changes to Terms",
      body: `We continuously improve ${APP_NAME} and may update features, limits, or these terms over time. When a material change is made to these terms, you will be asked to review and accept the updated version inside the app.`,
    },
  ],
}
