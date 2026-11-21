// The "reports" namespace's English texts: everything the Reports page shows, grouped by area. Part of the reports
// feature (i18n/). The source other languages translate (hi.ts); index.ts defines the namespace.

/** The reports feature's texts, in English. {{name}} marks a value filled in when the text is shown. */
const en = {
  page: {
    title: "Reports",
    description: "Monthly spending summary, category and payment breakdowns, and downloads (amounts in {{currency}}).",
    loadFailed: "Couldn't load the monthly report",
    previousMonth: "Previous month",
    nextMonth: "Next month",
  },
  downloads: {
    csv: "Download CSV",
    md: "Download Markdown",
    downloading: "Downloading…",
  },
  empty: {
    title: "No expenses in {{month}}",
    description: "Record an expense or choose another month to see a full breakdown and download your report.",
    addExpense: "Go to Expenses",
  },
  stats: {
    total: "Total spent",
    expenses_zero: "No expenses recorded",
    expenses_one: "{{count}} expense recorded",
    expenses_other: "{{count}} expenses recorded",
    previousMonth: "vs previous month ({{amount}})",
    changeUp: "+{{percent}}% vs previous month ({{amount}})",
    changeDown: "{{percent}}% vs previous month ({{amount}})",
    changeSame: "Same as previous month ({{amount}})",
    noPrevious: "No spending in the previous month",
    dailyAverage: "Daily average",
    daysCounted_one: "Across {{count}} day",
    daysCounted_other: "Across {{count}} days",
  },
  byCategory: {
    title: "By category",
    description: "Share of {{month}} spending by category",
    count_one: "{{count}} expense",
    count_other: "{{count}} expenses",
    share: "{{percent}}%",
  },
  byPayment: {
    title: "By payment method",
    description: "How you paid in {{month}}",
    count_one: "{{count}} expense",
    count_other: "{{count}} expenses",
    share: "{{percent}}%",
  },
  biggest: {
    title: "Biggest expenses",
    description: "Top individual expenses in {{month}}",
    categoryAndDate: "{{category}} · {{date}}",
  },
}

export default en
