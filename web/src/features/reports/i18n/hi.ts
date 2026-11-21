// The "reports" namespace in Hindi: a translation of en.ts, loaded only when Hindi is chosen. Part of the reports
// feature (i18n/). Machine-quality: to be reviewed by a native speaker.

import type { Translation } from "@/shared/i18n"

import type en from "./en"

/** The reports feature's texts, in Hindi. Same keys as en.ts; {{name}} placeholders stay as they are. */
const hi: Translation<typeof en> = {
  page: {
    title: "रिपोर्ट",
    description: "मासिक खर्च का सारांश, श्रेणी और भुगतान विश्लेषण, और डाउनलोड (राशि {{currency}} में)।",
    loadFailed: "मासिक रिपोर्ट लोड नहीं हो सकी",
    previousMonth: "पिछला महीना",
    nextMonth: "अगला महीना",
  },
  downloads: {
    csv: "CSV डाउनलोड करें",
    md: "Markdown डाउनलोड करें",
    downloading: "डाउनलोड हो रहा है…",
  },
  empty: {
    title: "{{month}} में कोई खर्च नहीं",
    description: "पूरा विवरण देखने और अपनी रिपोर्ट डाउनलोड करने के लिए कोई खर्च जोड़ें या दूसरा महीना चुनें।",
    addExpense: "खर्च पेज पर जाएँ",
  },
  stats: {
    total: "कुल खर्च",
    expenses_zero: "कोई खर्च दर्ज नहीं",
    expenses_one: "{{count}} खर्च दर्ज",
    expenses_other: "{{count}} खर्च दर्ज",
    previousMonth: "पिछले महीने ({{amount}}) की तुलना में",
    changeUp: "पिछले महीने ({{amount}}) से +{{percent}}%",
    changeDown: "पिछले महीने ({{amount}}) से {{percent}}%",
    changeSame: "पिछले महीने ({{amount}}) के बराबर",
    noPrevious: "पिछले महीने कोई खर्च नहीं था",
    dailyAverage: "दैनिक औसत",
    daysCounted_one: "{{count}} दिन में",
    daysCounted_other: "{{count}} दिनों में",
  },
  byCategory: {
    title: "श्रेणी के अनुसार",
    description: "श्रेणी के अनुसार {{month}} के खर्च का हिस्सा",
    count_one: "{{count}} खर्च",
    count_other: "{{count}} खर्च",
    share: "{{percent}}%",
  },
  byPayment: {
    title: "भुगतान के तरीके के अनुसार",
    description: "{{month}} में आपने कैसे भुगतान किया",
    count_one: "{{count}} खर्च",
    count_other: "{{count}} खर्च",
    share: "{{percent}}%",
  },
  biggest: {
    title: "सबसे बड़े खर्च",
    description: "{{month}} के सबसे बड़े खर्च",
    categoryAndDate: "{{category}} · {{date}}",
  },
}

export default hi
