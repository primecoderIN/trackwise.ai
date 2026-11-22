// Hindi texts for the public site's navigation, footer, home page, and contact page (Phase 29).
// Uses global, consumer-friendly wording with zero technical jargon. Part of app/_public/texts/.

import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"

import { HI_PRIVACY_TEXTS, HI_TERMS_TEXTS } from "./hi-legal"
import { HI_WALKTHROUGH_TEXTS } from "./hi-walkthrough"
import type { PublicSiteTexts } from "./types"

type SiteCoreTexts = Pick<
  PublicSiteTexts,
  | "lang"
  | "otherLang"
  | "otherLangLabel"
  | "paths"
  | "otherPaths"
  | "nav"
  | "footer"
  | "landing"
  | "privacyPage"
  | "termsPage"
  | "contactPage"
>

/** Hindi navigation, landing, legal, and contact texts. */
export const HI_SITE_TEXTS: SiteCoreTexts = {
  lang: "hi",
  otherLang: "en",
  otherLangLabel: "English",
  paths: {
    landing: ROUTES.landingHi,
    howItWorks: ROUTES.howItWorksHi,
    features: ROUTES.featuresHi,
    faq: ROUTES.faqHi,
    contact: ROUTES.contactHi,
    privacy: ROUTES.privacyHi,
    terms: ROUTES.termsHi,
  },
  otherPaths: {
    landing: ROUTES.landing,
    howItWorks: ROUTES.howItWorks,
    features: ROUTES.features,
    faq: ROUTES.faq,
    contact: ROUTES.contact,
    privacy: ROUTES.privacy,
    terms: ROUTES.terms,
  },
  nav: {
    howItWorks: "यह कैसे काम करता है",
    features: "विशेषताएँ",
    faq: "सामान्य प्रश्न",
    contact: "संपर्क",
    signIn: "साइन इन",
    openApp: "डैशबोर्ड खोलें",
  },
  footer: {
    tagline: `${APP_NAME} — अंग्रेज़ी और हिन्दी में AI खर्च ट्रैकिंग, रसीद स्कैनिंग, मासिक बजट और साफ़ रिपोर्ट।`,
    rights: `© 2026 ${APP_NAME}। निजी खाता सुरक्षा और स्पष्ट उपयोगकर्ता पुष्टि के साथ निर्मित।`,
    productHeading: "उत्पाद",
    supportHeading: "सहायता और संपर्क",
    languageHeading: "भाषा",
    home: "मुखपृष्ठ",
    howItWorks: "यह कैसे काम करता है",
    features: "विशेषताएँ",
    signIn: "साइन इन",
    faq: "सामान्य प्रश्न",
    contact: "संपर्क",
    languageLabel: "भाषा बदलें",
  },
  landing: {
    title: "AI खर्च ट्रैकर, रसीद स्कैनर और मासिक बजट",
    metaDescription:
      "सहज बातचीत से दैनिक खर्च ट्रैक करें, पुष्टि के साथ रसीदें स्कैन करें, मासिक बजट देखें, और अंग्रेज़ी व हिन्दी में साफ़ रिपोर्ट डाउनलोड करें।",
    keywords: ["AI खर्च ट्रैकर", "रसीद स्कैनर ऐप", "मासिक बजट प्लानर", "दैनिक खर्च हिसाब", APP_NAME],
    badge: "द्विभाषी AI खर्च कार्यक्षेत्र · English & हिन्दी",
    heroTitle: "बातचीत, रसीद स्कैन या साफ़ तालिका के ज़रिए हर खर्च का हिसाब रखें।",
    heroSubtitle: `${APP_NAME} एक तेज़ व्यक्तिगत बही-खाता, इंटरैक्टिव समीक्षा कार्ड वाला AI सहायक, पुष्टि आधारित रसीद स्कैनिंग और मासिक बजट निगरानी एक साथ लाता है।`,
    getStarted: "शुरू करें",
    openDashboard: "डैशबोर्ड खोलें",
    howItWorksCta: "जानें यह कैसे काम करता है",
    trustStrip: [
      "ब्राउज़र स्टोरेज में कोई निजी डेटा नहीं",
      "हर खाते के लिए अलग डेटा सुरक्षा",
      "सेव व हटाने से पहले आपकी पुष्टि",
      "अंग्रेज़ी और हिन्दी दोनों में उपलब्ध",
    ],
    walkthrough: HI_WALKTHROUGH_TEXTS,
    pillarsTitle: "एक व्यवस्थित कार्यक्षेत्र में सब कुछ",
    pillarsSubtitle: "दैनिक खर्च दर्ज करने, बजट सँभालने और मासिक सारांश पाने के लिए साफ़ व समर्पित टूल।",
    pillars: [
      {
        eyebrow: "AI सहायक और रसीदें",
        title: "सहज संवाद, विवरण जाँच और सुरक्षित पुष्टि",
        description: "आम भाषा में खर्च लिखें, फ़ील्ड निकालने के लिए रसीद अपलोड करें, और कुछ भी हटाने से पहले स्पष्ट पुष्टि करें।",
        hrefKey: "features",
        hash: "#assistant",
        linkLabel: "सहायक और रसीदें देखें",
      },
      {
        eyebrow: "खर्च और वैश्विक मुद्राएँ",
        title: "दुनिया की प्रमुख मुद्राओं में तेज़ लेजर",
        description: "USD, EUR, GBP आदि मुद्राओं में दर्ज प्रविष्टियाँ रखते हुए खर्च खोजें, फ़िल्टर करें, क्रमबद्ध करें और तुरंत संपादित करें।",
        hrefKey: "features",
        hash: "#expenses",
        linkLabel: "लेजर और मुद्राएँ देखें",
      },
      {
        eyebrow: "बजट और मासिक रिपोर्ट",
        title: "गति मीटर और एक-क्लिक डाउनलोड",
        description:
          "महीने के दिनों के मुकाबले श्रेणी व कुल सीमा देखें, समय रहते 80% चेतावनी पाएँ, और CSV या Markdown रिपोर्ट निर्यात करें।",
        hrefKey: "features",
        hash: "#budgets",
        linkLabel: "बजट और रिपोर्ट देखें",
      },
      {
        eyebrow: "गोपनीयता और नियंत्रण",
        title: "आपका वित्तीय डेटा पूरी तरह आपका रहता है",
        description:
          "बिना नए पासवर्ड के सुरक्षित साइन इन, अलग खाता रिकॉर्ड, दूर से सेशन साइन-आउट और हर महत्वपूर्ण बदलाव पर आपकी अनुमति।",
        hrefKey: "faq",
        hash: "#privacy-security-languages",
        linkLabel: "गोपनीयता प्रश्न पढ़ें",
      },
    ],
    workflowTitle: "एक मिनट से कम समय में शुरू करें",
    workflowSubtitle: "आपको पूरा नियंत्रण देते हुए मैनुअल मेहनत हटाने के लिए डिज़ाइन किया गया।",
    workflowSteps: [
      {
        step: "01",
        title: "सुरक्षित साइन इन करें और भाषा चुनें",
        description: "अपने विश्वसनीय प्रदाता खाते से साइन इन करें, अंग्रेज़ी या हिन्दी चुनें, और चाहें तो पहला मासिक बजट तय करें।",
      },
      {
        step: "02",
        title: "चैट, रसीद अपलोड या तालिका से दर्ज करें",
        description: "आम शब्दों में खर्च लिखें, रसीद की फ़ोटो या PDF अपलोड करें, या सीधे खर्च तालिका में जोड़ें और बदलें।",
      },
      {
        step: "03",
        title: "बजट गति देखें और रिपोर्ट डाउनलोड करें",
        description: "80% सीमा अलर्ट समय पर पाएँ, मासिक रुझान देखें, और कभी भी साफ़ CSV या Markdown सारांश डाउनलोड करें।",
      },
    ],
    workflowCta: "पूरा चरण-दर-चरण मार्गदर्शक देखें",
    bilingualBannerTitle: "हर भाषा में सहज स्पष्टता के लिए डिज़ाइन किया गया",
    bilingualBannerSubtitle:
      "हर पेज, बजट चेतावनी, सहायक उत्तर और डाउनलोड करने योग्य मासिक रिपोर्ट अंग्रेज़ी और हिन्दी के बीच आसानी से बदलती है।",
    bilingualCta: "View in English",
    ctaTitle: "अपने मासिक खर्च पर शांत और पूरा नियंत्रण पाएँ",
    ctaSubtitle: "अपना डैशबोर्ड खोलने के लिए साइन इन करें, या सामान्य प्रश्नों में हर सुविधा की कार्यप्रणाली देखें।",
    faqCta: "सभी सामान्य प्रश्न पढ़ें",
  },
  privacyPage: HI_PRIVACY_TEXTS,
  termsPage: HI_TERMS_TEXTS,
  contactPage: {
    title: "संपर्क और सहायता",
    metaDescription: `विश्वभर के उपयोगकर्ताओं के लिए ${APP_NAME} से उत्पाद सहायता, सुझाव या डेटा गोपनीयता अनुरोध साझा करें।`,
    keywords: ["संपर्क trackwise.ai", "खर्च ट्रैकर सहायता", "डेटा गोपनीयता अनुरोध", APP_NAME],
    intro: `${APP_NAME} के बारे में कोई प्रश्न है, अपने खाते में मदद चाहिए, या डेटा गोपनीयता के संबंध में हमारी टीम से बात करनी है? नीचे सीधे संपर्क करें।`,
    supportHeading: "उत्पाद सहायता",
    supportBody: "सुविधाओं से जुड़े प्रश्नों, खाता सहायता, सुझावों या बग रिपोर्ट के लिए:",
    supportEmail: "support@trackwise.ai",
    privacyHeading: "गोपनीयता और डेटा अनुरोध",
    privacyBody: "गोपनीयता संबंधी प्रश्नों, डेटा पहुँच, सुधार या खाता हटाने के अनुरोधों के लिए:",
    privacyEmail: "privacy@trackwise.ai",
    responseNote: "हम सभी सहायता और गोपनीयता अनुरोधों की तुरंत समीक्षा करते हैं और शीघ्र उत्तर देने का प्रयास करते हैं।",
  },
}
