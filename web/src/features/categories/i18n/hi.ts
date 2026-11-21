// The "categories" namespace in Hindi: a translation of en.ts, loaded only when Hindi is chosen. Part of the categories
// feature (i18n/). Machine-quality: to be reviewed by a native speaker.

import type { Translation } from "@/shared/i18n"

import type en from "./en"

/** The categories feature's texts, in Hindi. Same keys as en.ts; {{name}} placeholders stay as they are. */
const hi: Translation<typeof en> = {
  page: {
    title: "श्रेणियाँ",
    description: "हर साझा श्रेणी और उसमें आपका खर्च (राशि {{currency}} में)।",
    loadFailed: "श्रेणियाँ लोड नहीं हो सकीं",
    previousMonth: "पिछला महीना",
    nextMonth: "अगला महीना",
    empty: "कोई श्रेणी नहीं मिली।",
  },
  card: {
    expenses_zero: "{{month}} में कोई खर्च नहीं",
    expenses_one: "{{month}} में {{count}} खर्च",
    expenses_other: "{{month}} में {{count}} खर्च",
    share: "मासिक कुल का {{percent}}%",
    viewExpenses: "खर्च देखें",
    customSoon: "साझा श्रेणियाँ सभी के लिए उपलब्ध हैं। खाते के अनुसार कस्टम श्रेणियाँ अगले अपडेट में आएँगी।",
  },
  select: {
    loadFailed: "श्रेणियाँ लोड नहीं हो सकीं",
    loading: "लोड हो रहा है…",
    choose: "कोई श्रेणी चुनें",
  },
  unknown: "अज्ञात",
}

export default hi
