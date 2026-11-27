// Hindi texts for the public site's navigation, footer, home page, and contact page (Phase 29).
// Uses global, consumer-friendly wording with zero technical jargon. Part of app/_public/texts/.

import { APP_NAME } from "@/shared/config/app"

import { HI_PRIVACY_TEXTS, HI_TERMS_TEXTS } from "./hi-legal"
import { HI_WALKTHROUGH_TEXTS } from "./hi-walkthrough"
import type { PublicSiteTexts } from "./types"

type SiteCoreTexts = Pick<
  PublicSiteTexts,
  "lang" | "nav" | "footer" | "landing" | "privacyPage" | "termsPage" | "contactPage"
>

/** Hindi navigation, landing, legal, and contact texts. */
export const HI_SITE_TEXTS: SiteCoreTexts = {
  lang: "hi",
  nav: {
    howItWorks: "यह कैसे काम करता है",
    features: "विशेषताएँ",
    faq: "सामान्य प्रश्न",
    contact: "संपर्क",
    signIn: "साइन इन",
    openApp: "डैशबोर्ड खोलें",
    primaryLabel: "मुख्य नेविगेशन",
    menuLabel: "मेन्यू खोलें",
  },
  footer: {
    tagline: `${APP_NAME} — अंग्रेज़ी और हिन्दी में AI खर्च ट्रैकिंग, बिल स्प्लिटिंग, रसीद स्कैनिंग, मासिक बजट और साफ़ रिपोर्ट।`,
    rights: `© 2026 ${APP_NAME}। निजी खाता सुरक्षा और स्पष्ट उपयोगकर्ता पुष्टि के साथ निर्मित।`,
    productHeading: "उत्पाद",
    supportHeading: "सहायता और संपर्क",
    legalHeading: "कानूनी",
    languageHeading: "भाषा",
    home: "मुखपृष्ठ",
    howItWorks: "यह कैसे काम करता है",
    features: "विशेषताएँ",
    signIn: "साइन इन",
    faq: "सामान्य प्रश्न",
    contact: "संपर्क",
    privacy: "गोपनीयता नीति",
    terms: "सेवा की शर्तें",
    languageLabel: "भाषा बदलें",
  },
  landing: {
    title: "AI खर्च ट्रैकर, बिल स्प्लिटिंग, रसीद स्कैनर और मासिक बजट",
    metaDescription:
      "सहज बातचीत से दैनिक खर्च ट्रैक करें, निजी या साझा ग्रुप में आमंत्रण लिंक और वैकल्पिक INR UPI QR से बिल बाँटें, पुष्टि के साथ रसीदें स्कैन करें, मासिक बजट देखें, और अंग्रेज़ी व हिन्दी में साफ़ रिपोर्ट डाउनलोड करें।",
    keywords: [
      "AI खर्च ट्रैकर",
      "बिल स्प्लिट ऐप",
      "साझा ग्रुप खर्च",
      "रसीद स्कैनर ऐप",
      "मासिक बजट प्लानर",
      "दैनिक खर्च हिसाब",
      APP_NAME,
    ],
    badge: "द्विभाषी AI खर्च और स्प्लिट कार्यक्षेत्र · English & हिन्दी",
    heroTitle: "बातचीत, रसीद स्कैन या साफ़ तालिका के ज़रिए हर खर्च ट्रैक करें और साझा बिल बाँटें।",
    heroSubtitle: `${APP_NAME} एक तेज़ व्यक्तिगत बही-खाता, आमंत्रण लिंक व वैकल्पिक UPI QR वाले निजी और साझा स्प्लिट ग्रुप, समीक्षा कार्ड वाला AI सहायक, रसीद स्कैनिंग और मासिक बजट निगरानी एक साथ लाता है।`,
    getStarted: "शुरू करें",
    openDashboard: "डैशबोर्ड खोलें",
    howItWorksCta: "जानें यह कैसे काम करता है",
    trustStrip: [
      "ब्राउज़र स्टोरेज में कोई निजी डेटा नहीं",
      "साझा ग्रुप में भी व्यक्तिगत खर्च पूरी तरह निजी",
      "सेव व हटाने से पहले आपकी पुष्टि",
      "अंग्रेज़ी और हिन्दी दोनों में उपलब्ध",
    ],
    walkthrough: HI_WALKTHROUGH_TEXTS,
    pillarsTitle: "एक व्यवस्थित कार्यक्षेत्र में सब कुछ",
    pillarsSubtitle: "दैनिक खर्च दर्ज करने, साझा बिल बाँटने, बजट सँभालने और मासिक सारांश पाने के लिए साफ़ व समर्पित टूल।",
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
        eyebrow: "स्प्लिट्स और साझा ग्रुप",
        title: "साफ़ हिसाब के साथ बिल बाँटें—अकेले या साथ मिलकर",
        description:
          "निजी या साझा ग्रुप बनाएँ, बराबर या सटीक राशि में बाँटें, आमंत्रण लिंक से गेस्ट सीट क्लेम करें और वैकल्पिक INR UPI QR से भुगतान करें।",
        hrefKey: "features",
        hash: "#splits",
        linkLabel: "बिल स्प्लिटिंग और ग्रुप देखें",
      },
      {
        eyebrow: "मुद्राएँ, बजट और रिपोर्ट",
        title: "बहु-मुद्रा लेजर, गति मीटर और डाउनलोड रिपोर्ट",
        description:
          "विश्व की प्रमुख मुद्राओं में खर्च दर्ज करें, महीने के हिसाब से 80% बजट चेतावनी पाएँ, और CSV या Markdown रिपोर्ट निर्यात करें।",
        hrefKey: "features",
        hash: "#budgets",
        linkLabel: "बजट और रिपोर्ट देखें",
      },
      {
        eyebrow: "गोपनीयता और नियंत्रण",
        title: "आपका व्यक्तिगत वित्तीय डेटा हमेशा आपका रहता है",
        description:
          "बिना नए पासवर्ड के सुरक्षित साइन इन, सख़्त खाता अलगाव (साझा ग्रुप में भी व्यक्तिगत खर्च निजी रहते हैं), सेशन नियंत्रण और स्पष्ट अनुमति।",
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
        title: "सुरक्षित साइन इन करें और प्राथमिकताएँ चुनें",
        description:
          "अपने विश्वसनीय प्रदाता खाते से साइन इन करें, अपनी भाषा (अंग्रेज़ी या हिन्दी), डिफ़ॉल्ट मुद्रा और टाइमज़ोन चुनें, और चाहें तो पहला मासिक बजट तय करें।",
      },
      {
        step: "02",
        title: "खर्च दर्ज करें और साझा बिल बाँटें",
        description:
          "चैट में खर्च लिखें, रसीद की फ़ोटो या PDF स्कैन करें, तालिका में प्रविष्टि जोड़ें, या ग्रुप बिल बाँटकर केवल अपना हिस्सा निजी लेजर में दर्ज करें।",
      },
      {
        step: "03",
        title: "हिसाब निपटाएँ, बजट गति देखें और रिपोर्ट डाउनलोड करें",
        description:
          "हर ग्रुप का बकाया मुद्रा के अनुसार अलग रखें, साफ़ सेटलमेंट दर्ज करें, 80% बजट अलर्ट पाएँ और CSV या Markdown सारांश डाउनलोड करें।",
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
