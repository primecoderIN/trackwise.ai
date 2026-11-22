// Combines the English and Hindi public site catalogs and exports `getPublicSiteTexts(lang)`. Part of app/_public/texts/.

import type { Language } from "@/shared/i18n"

import { EN_FAQ_TEXTS } from "./en-faq"
import { EN_FEATURES_TEXTS } from "./en-features"
import { EN_HOW_IT_WORKS_TEXTS } from "./en-how-it-works"
import { EN_SITE_TEXTS } from "./en-site"
import { HI_FAQ_TEXTS } from "./hi-faq"
import { HI_FEATURES_TEXTS } from "./hi-features"
import { HI_HOW_IT_WORKS_TEXTS } from "./hi-how-it-works"
import { HI_SITE_TEXTS } from "./hi-site"
import type { PublicSiteTexts } from "./types"

const EN_ALL: PublicSiteTexts = {
  ...EN_SITE_TEXTS,
  howItWorksPage: EN_HOW_IT_WORKS_TEXTS,
  featuresPage: EN_FEATURES_TEXTS,
  faqPage: EN_FAQ_TEXTS,
}

const HI_ALL: PublicSiteTexts = {
  ...HI_SITE_TEXTS,
  howItWorksPage: HI_HOW_IT_WORKS_TEXTS,
  featuresPage: HI_FEATURES_TEXTS,
  faqPage: HI_FAQ_TEXTS,
}

/** Returns the complete server-rendered public site texts for `lang` ("en" or "hi"). */
export function getPublicSiteTexts(lang: Language): PublicSiteTexts {
  return lang === "hi" ? HI_ALL : EN_ALL
}

export type {
  ControlGuarantee,
  FaqCategory,
  FaqPageTexts,
  FeatureShowcaseSection,
  FeaturesPageTexts,
  HowItWorksPageTexts,
  HowItWorksStep,
  LegalPageTexts,
  PublicRouteKey,
  PublicSiteTexts,
  SurfaceCapabilityRow,
  WalkthroughSceneTexts,
  WalkthroughTexts,
} from "./types"
