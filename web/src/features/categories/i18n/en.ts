// The "categories" namespace's English texts: everything the categories feature shows, grouped by area. Part of
// the categories feature (i18n/). The source other languages translate (hi.ts); index.ts defines the namespace.
// Category names themselves aren't here: they're data from the backend.

/** The categories feature's texts, in English. `{name}` marks an ICU interpolation placeholder. */
const en = {
  page: {
    title: "Categories",
    description: "Every shared category and how much you've spent in it (amounts in {currency}).",
    loadFailed: "Couldn't load categories",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    sortBySpend: "Highest spend",
    sortByName: "A–Z",
    empty: "No categories found.",
  },
  card: {
    expenses: "{count, plural, =0 {No expenses in {month}} one {# expense in {month}} other {# expenses in {month}}}",
    share: "{percent}% of monthly total",
    viewExpenses: "View expenses",
    customSoon: "Shared categories are available to everyone. Custom categories per account arrive in a future update.",
  },
  // The category dropdown's placeholder, which also says why its list is empty.
  select: {
    loadFailed: "Couldn't load categories",
    loading: "Loading…",
    choose: "Choose a category",
  },
  // What a list shows for an expense whose category isn't among the loaded ones.
  unknown: "Unknown",
}

export default en
