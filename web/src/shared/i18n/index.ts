// Shared i18n public API: language definitions, cookie/header helpers, next-intl language hook, and language switcher.

export { loadCommonMessages, type CommonTexts } from "./common"
export { LanguageMenu } from "./language-menu"
export {
  ACCEPT_LANGUAGE,
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGE_CODES,
  LANGUAGES,
  LOCALE_COOKIE,
  matchLanguageHeader,
  openGraphLocale,
  setLocaleCookie,
  type Language,
  type LanguageInfo,
} from "./languages"
export type { Translation } from "./namespace"
export { useLanguage, type LanguageState } from "./use-language"
