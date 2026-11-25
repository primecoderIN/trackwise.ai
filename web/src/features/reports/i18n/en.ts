// The "reports" namespace's English texts: everything the Reports page shows, grouped by area. Part of the reports
// feature (i18n/). The source other languages translate (hi.ts); index.ts defines the namespace.

/** The reports feature's texts, in English. `{name}` marks an ICU placeholder or plural rule. */
const en = {
  page: {
    title: "Reports",
    description: "Monthly spending summary, category and payment breakdowns, and downloads (amounts in {currency}).",
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
    title: "No expenses in {month}",
    description: "Record an expense or choose another month to see a full breakdown and download your report.",
    addExpense: "Go to Expenses",
  },
  stats: {
    total: "Total spent",
    expenses: "{count, plural, =0 {No expenses recorded} one {# expense recorded} other {# expenses recorded}}",
    previousMonth: "vs previous month ({amount})",
    changeUp: "+{percent}% vs previous month ({amount})",
    changeDown: "{percent}% vs previous month ({amount})",
    changeSame: "Same as previous month ({amount})",
    noPrevious: "No spending in the previous month",
    dailyAverage: "Daily average",
    daysCounted: "{count, plural, one {Across # day} other {Across # days}}",
  },
  byCategory: {
    title: "By category",
    description: "Share of {month} spending by category",
    count: "{count, plural, one {# expense} other {# expenses}}",
    share: "{percent}%",
  },
  byPayment: {
    title: "By payment method",
    description: "How you paid in {month}",
    count: "{count, plural, one {# expense} other {# expenses}}",
    share: "{percent}%",
  },
  biggest: {
    title: "Biggest expenses",
    description: "Top individual expenses in {month}",
    categoryAndDate: "{category} · {date}",
  },
}

export default en
