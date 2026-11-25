// The "dashboard" namespace's English texts: everything the dashboard feature shows, grouped by area. Part of
// the dashboard feature (i18n/). The source other languages translate (hi.ts); index.ts defines the namespace.

/** The dashboard feature's texts, in English. `{name}` marks an ICU placeholder or plural rule. */
const en = {
  page: {
    title: "Dashboard",
    description: "Your spending at a glance (amounts in {currency}).",
    loadFailed: "Couldn't load the dashboard",
  },
  stats: {
    spentIn: "Spent in {month}",
    noExpensesThisMonth: "No expenses yet this month",
    totalOfMonth: "Total of this month's expenses",
    expensesThisMonth: "Expenses this month",
    categoriesUsed: "{count, plural, one {# category used} other {# categories used}}",
    topCategory: "Top category",
    topAcross: "{count, plural, one {{amount} across # expense} other {{amount} across # expenses}}",
    nothingSpent: "Nothing spent yet",
  },
  byCategory: {
    title: "By category",
    empty: "No spending this month yet.",
  },
  trend: {
    title: "Monthly trend",
    lastMonths: "{count, plural, one {Last # month} other {Last # months}}",
    empty: "{count, plural, one {No spending in the last # month.} other {No spending in the last # months.}}",
  },
  recent: {
    title: "Recent expenses",
    latest:
      "{count, plural, =0 {The latest you recorded} one {The latest # you recorded} other {The latest # you recorded}}",
    categoryAndDate: "{category} · {date}",
    viewAll: "View all",
    empty: "No expenses yet.",
  },
  charts: {
    spent: "Spent",
  },
  budget: {
    title: "Budget",
    description: "This month against your limits",
    open: "Open Budgets",
    spentOf: "{spent} of {limit}",
    meter: "Overall: {percent}% of the limit used",
    today: "Today: {percent}% of the month",
    noLimit: "No overall limit yet.",
    attention:
      "{count, plural, one {# category is near or over its limit} other {# categories are near or over their limits}}",
    allOnTrack: "Every category with a limit is on track",
    loadFailed: "Couldn't load your budgets.",
  },
  addExpense: "Add an expense",
}

export default en
