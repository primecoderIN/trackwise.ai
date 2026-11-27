// Lazily loads only the requested language's public site catalog on the server (cached per request).
// Part of app/_public/texts/.

import { cache } from "react"

import type { Language } from "@/shared/i18n/languages"

import type { PublicSiteTexts } from "./types"

const LOADERS: Record<Language, () => Promise<PublicSiteTexts>> = {
  en: async () => {
    const [{ EN_SITE_TEXTS }, { EN_HOW_IT_WORKS_TEXTS }, { EN_FEATURES_TEXTS }, { EN_FAQ_TEXTS }] = await Promise.all([
      import("./en-site"),
      import("./en-how-it-works"),
      import("./en-features"),
      import("./en-faq"),
    ])
    return {
      ...EN_SITE_TEXTS,
      howItWorksPage: EN_HOW_IT_WORKS_TEXTS,
      featuresPage: EN_FEATURES_TEXTS,
      faqPage: EN_FAQ_TEXTS,
    }
  },
  hi: async () => {
    const [{ HI_SITE_TEXTS }, { HI_HOW_IT_WORKS_TEXTS }, { HI_FEATURES_TEXTS }, { HI_FAQ_TEXTS }] = await Promise.all([
      import("./hi-site"),
      import("./hi-how-it-works"),
      import("./hi-features"),
      import("./hi-faq"),
    ])
    return {
      ...HI_SITE_TEXTS,
      howItWorksPage: HI_HOW_IT_WORKS_TEXTS,
      featuresPage: HI_FEATURES_TEXTS,
      faqPage: HI_FAQ_TEXTS,
    }
  },
}

/** Returns the complete server-rendered public site texts for `lang`, dynamically loading only that locale. */
export const getPublicSiteTexts = cache((lang: Language): Promise<PublicSiteTexts> => LOADERS[lang]())

export type {
  AssistantWalkthroughSceneTexts,
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
  SplitsWalkthroughSceneTexts,
  SurfaceCapabilityRow,
  WalkthroughSceneTexts,
  WalkthroughSplitsPanelTexts,
  WalkthroughTexts,
} from "./types"
