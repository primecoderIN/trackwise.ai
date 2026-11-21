// The "app" namespace in Hindi: a translation of en.ts, loaded only when Hindi is chosen. Part of the app
// composition (app/_i18n/). Machine-quality: to be reviewed by a native speaker.

import type { Translation } from "@/shared/i18n"

import type en from "./en"

/** The app frame's texts, in Hindi. Same keys as en.ts; {{name}} placeholders stay as they are. */
const hi: Translation<typeof en> = {
  menu: "मेन्यू",
  groups: {
    overview: "अवलोकन",
    money: "धन और खर्च",
    insights: "विश्लेषण",
    account: "सेटिंग्स",
  },
  pages: {
    dashboard: "डैशबोर्ड",
    expenses: "खर्च",
    budgets: "बजट",
    categories: "श्रेणियाँ",
    reports: "रिपोर्ट",
    settings: "सेटिंग्स",
    signIn: "साइन इन",
  },
  palette: {
    open: "खोजें या पेज पर जाएँ…",
    shortcut: "Ctrl+K",
    title: "कमांड पैलेट",
    description: "किसी भी पेज पर जाएँ या कोई कार्रवाई चलाएँ।",
    placeholder: "पेज या कार्रवाई लिखें…",
    empty: "कोई मेल खाता पेज या कार्रवाई नहीं मिली।",
    pagesGroup: "पेज",
    actionsGroup: "त्वरित कार्रवाइयाँ",
    newExpense: "नया खर्च जोड़ें",
    openAssistant: "सहायक खोलें",
  },
  welcome: {
    title: "{{app}} में आपका स्वागत है",
    description: "एक मिनट में अपना खाता सेट करें, या छोड़ें और तुरंत शुरू करें।",
    stepLanguage: "1. अपनी भाषा चुनें",
    stepBudget: "2. वैकल्पिक मासिक बजट ({{currency}} में)",
    budgetPlaceholder: "जैसे 25000",
    budgetHint: "अगर आप बाद में बजट तय करना चाहते हैं तो इसे खाली छोड़ दें।",
    stepAssistant: "3. सहायक आज़माएँ",
    assistantHint: "सेटअप के बाद सहायक में आज़माने के लिए एक वाक्य चुनें, या कोई नहीं चुनें:",
    prompt1: "आज Swiggy पर दोपहर के खाने में UPI से 250 खर्च किए",
    prompt2: "इस महीने मैंने कुल कितना खर्च किया?",
    termsLabel: "मैं सेवा की शर्तों और गोपनीयता नीति ({{version}}) से सहमत हूँ।",
    viewTerms: "शर्तें",
    viewPrivacy: "गोपनीयता",
    skip: "स्वीकार करें और सेटअप छोड़ें",
    finish: "सेटअप पूरा करें",
    saving: "सहेजा जा रहा है…",
  },
  notFound: {
    title: "पेज नहीं मिला",
    description: "इस पते पर कोई पेज नहीं है।",
    backHome: "डैशबोर्ड पर जाएँ",
    backLanding: "मुखपृष्ठ",
  },
  assistant: {
    open: "सहायक",
    title: "सहायक",
    description: "{{app}} सहायक से बात करें।",
  },
  errors: {
    app: "{{app}} में कोई समस्या आ गई",
    page: "इस पेज में कोई समस्या आ गई",
    assistant: "सहायक में कोई समस्या आ गई",
    backHome: "डैशबोर्ड पर जाएँ",
  },
}

export default hi
