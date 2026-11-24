// The "app" namespace's English texts: what the app's frame shows (the menu, page names, the top bar, the error
// cards around the page area and the chat). Part of the app composition (app/_i18n/). Other languages translate it.

/** The app frame's texts, in English. {{name}} marks a value filled in when the text is shown. */
const en = {
  menu: "Menu",
  groups: {
    overview: "Overview",
    money: "Money",
    insights: "Insights",
    account: "Settings",
  },
  pages: {
    dashboard: "Dashboard",
    expenses: "Expenses",
    budgets: "Budgets",
    categories: "Categories",
    reports: "Reports",
    settings: "Settings",
    // Only the browser tab's title (the sign-in page has its own heading).
    signIn: "Sign in",
  },
  palette: {
    open: "Search or jump to…",
    shortcut: "Ctrl+K",
    title: "Command palette",
    description: "Jump to any page or run an action.",
    placeholder: "Type a page or action…",
    empty: "No matching pages or actions.",
    pagesGroup: "Pages",
    actionsGroup: "Quick actions",
    newExpense: "Add a new expense",
    openAssistant: "Open the assistant",
  },
  welcome: {
    title: "Welcome to {{app}}",
    description: "Set up your preferences in a minute, or skip and start right away.",
    stepLanguage: "1. Choose your language",
    stepRegion: "2. Default currency and timezone",
    currencyLabel: "Default currency",
    currencyHint: "Pre-selected when adding expenses. Totals and budgets use {{baseCurrency}}.",
    timezoneLabel: "Timezone",
    timezoneHint: "Auto-detected from your browser; used for today's date and monthly periods.",
    stepBudget: "3. Optional monthly budget (in {{currency}})",
    budgetPlaceholder: "e.g. 2000",
    budgetHint: "Leave blank if you'd rather set budgets later.",
    stepAssistant: "4. Try the assistant",
    assistantHint: "Choose a starter prompt to try in the assistant after setup, or pick none:",
    prompt1: "I spent {{amount}} on lunch at Corner Bistro today by card",
    prompt2: "How much did I spend this month?",
    termsLabel: "I agree to the Terms of Service and Privacy Policy ({{version}}).",
    viewTerms: "Terms",
    viewPrivacy: "Privacy",
    skip: "Accept & skip setup",
    finish: "Finish setup",
    saving: "Saving…",
  },
  notFound: {
    title: "Page not found",
    description: "There's no page at this address.",
    backHome: "Go to Dashboard",
    backLanding: "Home page",
  },
  assistant: {
    open: "Assistant",
    title: "Assistant",
    description: "Chat with the {{app}} assistant.",
  },
  errors: {
    app: "{{app}} hit a problem",
    page: "This page hit a problem",
    assistant: "The assistant hit a problem",
    backHome: "Go to Dashboard",
  },
}

export default en
