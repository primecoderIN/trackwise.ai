// The "expenses" namespace's English texts: everything the expenses feature shows, grouped by area. Part of
// the expenses feature (i18n/). The source other languages translate (hi.ts); index.ts defines the namespace.
// Not here: what the backend sends (payment-method labels, category names, its error messages) and user data.

/** The expenses feature's texts, in English. `{name}` marks an ICU placeholder or plural rule. */
const en = {
  page: {
    title: "Expenses",
    description: "Add, find, edit and delete your expenses.",
    loadFailed: "Couldn't load your expenses",
  },
  // An expense's fields: the Add dialog's labels, the filters' Category, and the table's column titles.
  fields: {
    id: "ID",
    date: "Date",
    merchant: "Merchant",
    category: "Category",
    amount: "Amount",
    currency: "Currency",
    paidWith: "Paid with",
    note: "Note",
    noteOptional: "Note (optional)",
  },
  // The dialogs' buttons.
  actions: {
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    delete: "Delete",
  },
  // The Add expense button and dialog. The examples are the inputs' placeholders.
  add: {
    open: "Add expense",
    title: "Add expense",
    description: "Amounts are in {currency}, e.g. {example}.",
    merchantExample: "Corner Bistro",
    noteExample: "Dinner",
    added: "Expense added",
  },
  filters: {
    search: "Search",
    searchPlaceholder: "Merchant or note",
    clearSearch: "Clear search",
    allCategories: "All categories",
    from: "From",
    to: "To",
    presetThisMonth: "This month",
    presetLastMonth: "Last month",
    presetLast30Days: "Last 30 days",
    clear: "Clear filters",
  },
  // The count line above the table; its parts are joined with " · ".
  toolbar: {
    count: "{count, plural, one {# expense} other {# expenses}}",
    showingNewest: "showing the newest {shown}",
    showingRange: "showing {from}–{to}",
    pageTotal: "Page total {amount}",
    pageOf: "Page {page} of {pages}",
    selected: "{count, plural, one {# selected} other {# selected}}",
    deleteSelected: "Delete selected",
    previousPage: "Previous page",
    nextPage: "Next page",
  },
  // The table's own texts; its column titles are under "fields".
  table: {
    loading: "Loading…",
    noMatches: "No expenses match these filters.",
    emptyTitle: "No expenses recorded yet",
    emptyDescription: "Add your first expense here or ask the assistant in the chat panel.",
    sortBy: "Sort by {column}",
    selectAll: "Select all",
    selectRow: "Select #{id}",
    actions: "Actions",
    editRow: "Edit #{id}",
    deleteRow: "Delete #{id}",
  },
  // The inline edit row: each control's name for screen readers, its buttons, and the toast after a save.
  edit: {
    title: "Edit expense #{id}",
    description: "Update details for this expense. Only changed fields are saved.",
    date: "Date of #{id}",
    merchant: "Merchant of #{id}",
    category: "Category of #{id}",
    amount: "Amount of #{id}",
    currency: "Currency of #{id}",
    paymentMethod: "Payment method of #{id}",
    note: "Note of #{id}",
    save: "Save changes to #{id}",
    cancel: "Cancel editing #{id}",
    updated: "Expense updated",
  },
  // The "are you sure?" dialog before a delete, and the toasts after it.
  delete: {
    titleOne: "Delete this expense?",
    titleSeveral: "{count, plural, one {Delete # expense?} other {Delete # expenses?}}",
    describeOne: "{merchant}, {amount} on {date}. This can't be undone.",
    describeSeveral: "This can't be undone.",
    deleted: "{count, plural, one {Expense deleted} other {# expenses deleted}}",
    failed: "{count, plural, one {Couldn't delete #: {reason}} other {Couldn't delete #: {reason}}}",
  },
}

export default en
