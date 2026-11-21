// The "reports" namespace: the reports feature's texts. Part of the reports feature (i18n/). Its components read them
// with useTexts(); the Reports page's lazy loader in index.ts loads them with its code.

import { defineNamespace } from "@/shared/i18n"

import type en from "./en"

/** The reports feature's texts: each language's file is fetched when first needed. */
export const reportsTexts = defineNamespace("reports", { en: () => import("./en"), hi: () => import("./hi") })

/** The reports feature's texts in a component: `const { t } = useTexts()`. */
export const useTexts = reportsTexts.useTexts

declare module "i18next" {
  interface ResourceNamespaceMap {
    reports: typeof en
  }
}
