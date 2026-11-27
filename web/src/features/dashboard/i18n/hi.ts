// The "dashboard" namespace in Hindi: a translation of en.ts, loaded only when Hindi is chosen. Part of the dashboard
// feature (i18n/). Machine-quality: to be reviewed by a native speaker.

import type { Translation } from "@/shared/i18n"

import type en from "./en"

/** The dashboard feature's texts, in Hindi. Same keys as en.ts; ICU placeholders and plural forms match en.ts. */
const hi: Translation<typeof en> = {
  page: {
    title: "डैशबोर्ड",
    description: "आपके खर्च पर एक नज़र (राशि {currency} में)।",
    loadFailed: "डैशबोर्ड लोड नहीं हो सका",
  },
  stats: {
    spentIn: "{month} में खर्च किए गए",
    noExpensesThisMonth: "इस महीने अभी तक कोई खर्च नहीं",
    totalOfMonth: "इस महीने के सभी दर्ज खर्चों का कुल योग",
    vsLastMonthUp: "पिछले महीने से +{percent}%",
    vsLastMonthDown: "पिछले महीने से -{percent}%",
    vsLastMonthSame: "पिछले महीने के बराबर",
    expensesThisMonth: "लेन-देन",
    categoriesUsed: "{count, plural, one {# श्रेणी इस्तेमाल हुई} other {# श्रेणियाँ इस्तेमाल हुईं}}",
    averageExpense: "औसत {amount} प्रति खर्च",
    topCategory: "सबसे बड़ी श्रेणी",
    topAcross: "{count, plural, one {# खर्च में कुल {amount}} other {# खर्चों में कुल {amount}}}",
    topShare: "मासिक खर्च का {percent}%",
    nothingSpent: "अभी तक कुछ खर्च नहीं हुआ",
  },
  byCategory: {
    title: "श्रेणी के अनुसार खर्च",
    hint: "खर्च फ़िल्टर करने के लिए श्रेणी पर क्लिक करें",
    empty: "इस महीने अभी तक कोई खर्च नहीं हुआ है।",
  },
  trend: {
    title: "मासिक रुझान",
    lastMonths: "{count, plural, one {पिछला # महीना} other {पिछले # महीने}}",
    averageLabel: "औसत {amount}",
    empty: "{count, plural, one {पिछले # महीने में कोई खर्च नहीं हुआ।} other {पिछले # महीनों में कोई खर्च नहीं हुआ।}}",
  },
  recent: {
    title: "हाल के खर्च",
    latest:
      "{count, plural, =0 {आपके दर्ज किए गए सबसे नए खर्च} one {आपका दर्ज किया गया सबसे नया # खर्च} other {आपके दर्ज किए गए सबसे नए # खर्च}}",
    categoryAndDate: "{category} · {date}",
    viewAll: "सभी देखें",
    empty: "अभी कोई खर्च नहीं है।",
  },
  charts: {
    spent: "खर्च",
  },
  budget: {
    title: "बजट",
    description: "इस महीने का खर्च आपकी सीमाओं के मुकाबले",
    open: "बजट खोलें",
    spentOf: "{limit} में से {spent}",
    meter: "कुल: सीमा का {percent}% इस्तेमाल हुआ",
    today: "आज: महीने का {percent}%",
    noLimit: "अभी कोई कुल सीमा नहीं है।",
    attention:
      "{count, plural, one {# श्रेणी अपनी सीमा के पास या उससे ज़्यादा है} other {# श्रेणियाँ अपनी सीमा के पास या उससे ज़्यादा हैं}}",
    allOnTrack: "सीमा वाली हर श्रेणी ठीक चल रही है",
    loadFailed: "आपके बजट लोड नहीं हो सके।",
  },
  addExpense: "खर्च जोड़ें",
}

export default hi
