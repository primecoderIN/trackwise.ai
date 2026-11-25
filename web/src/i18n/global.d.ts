// Global type augmentation for next-intl (`AppConfig`): enforces strict locale codes and namespace/key checking
// across Server and Client Components via `useTranslations` and `getTranslations`.

import type { AppTexts } from "@/app/_i18n"
import type { CommonTexts, Language } from "@/shared/i18n"

/** Complete typed message structure exposed through `next-intl` hooks and server translators. */
export interface AppMessages {
  common: CommonTexts
  app: AppTexts
}

declare module "next-intl" {
  interface AppConfig {
    Locale: Language
    Messages: AppMessages
  }
}
