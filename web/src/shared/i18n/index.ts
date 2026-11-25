// Shared i18n public API: language definitions, cookie/header helpers, next-intl language hook, and language switcher.
// Temporary legacy i18next exports remain until feature namespaces complete migration to next-intl.

export { loadCommonMessages, type CommonTexts } from "./common"
export {
  currentDatePickerLocale,
  currentLanguage,
  currentLanguageInfo,
  i18n,
  initI18n,
  languageHeaders,
  loadNamespaces,
  setLanguage,
} from "./i18n"
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
export { defineNamespace, type AnyNamespace, type Namespace, type Texts, type Translation } from "./namespace"
export { useLanguage, type LanguageState } from "./use-language"
