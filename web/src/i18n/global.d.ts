// Global type augmentation for next-intl (`AppConfig`): enforces strict locale codes and namespace/key checking
// across Server and Client Components via `useTranslations` and `getTranslations`.

import type { AppTexts } from "@/app/_i18n"
import type { AccountTexts } from "@/features/account/i18n"
import type { AssistantTexts } from "@/features/assistant/i18n"
import type { AuthTexts } from "@/features/auth/i18n"
import type { BudgetsTexts } from "@/features/budgets/i18n"
import type { CategoriesTexts } from "@/features/categories/i18n"
import type { DashboardTexts } from "@/features/dashboard/i18n"
import type { ExpensesTexts } from "@/features/expenses/i18n"
import type { ReportsTexts } from "@/features/reports/i18n"
import type { CommonTexts, Language } from "@/shared/i18n"

/** Complete typed message structure exposed through `next-intl` hooks and server translators. */
export interface AppMessages {
  common: CommonTexts
  app: AppTexts
  auth: AuthTexts
  assistant: AssistantTexts
  account: AccountTexts
  budgets: BudgetsTexts
  categories: CategoriesTexts
  dashboard: DashboardTexts
  expenses: ExpensesTexts
  reports: ReportsTexts
}

declare module "next-intl" {
  interface AppConfig {
    Locale: Language
    Messages: AppMessages
  }
}
