// Combines the English and Hindi public site catalogs and exports `getPublicSiteTexts(lang)`. Part of app/_public/texts/.

import type { Language } from "@/shared/i18n"

import { EN_FEATURES_TEXTS } from "./en-features"
import { EN_SITE_TEXTS } from "./en-site"
import { EN_FAQ_TEXTS, EN_SECURITY_TEXTS } from "./en-trust"
import { HI_FEATURES_TEXTS } from "./hi-features"
import { HI_SITE_TEXTS } from "./hi-site"
import { HI_FAQ_TEXTS, HI_SECURITY_TEXTS } from "./hi-trust"
import type { PublicSiteTexts } from "./types"

const EN_ALL: PublicSiteTexts = {
  ...EN_SITE_TEXTS,
  featuresPage: EN_FEATURES_TEXTS,
  securityPage: EN_SECURITY_TEXTS,
  faqPage: EN_FAQ_TEXTS,
}

const HI_ALL: PublicSiteTexts = {
  ...HI_SITE_TEXTS,
  featuresPage: HI_FEATURES_TEXTS,
  securityPage: HI_SECURITY_TEXTS,
  faqPage: HI_FAQ_TEXTS,
}

/** Returns the complete server-rendered public site texts for `lang` ("en" or "hi"). */
export function getPublicSiteTexts(lang: Language): PublicSiteTexts {
  return lang === "hi" ? HI_ALL : EN_ALL
}

export type {
  FaqCategory,
  FeatureShowcaseSection,
  FeaturesPageTexts,
  PublicRouteKey,
  PublicSiteTexts,
  SecurityPageTexts,
  WalkthroughSceneTexts,
  WalkthroughTexts,
} from "./types"
