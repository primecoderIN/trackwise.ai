// The "common" namespace's English texts: what shared/ itself shows (the API client's errors, the error and refresh
// cards, the placeholder page, the theme and language menus, toasts, and date picker labels). Part of shared/i18n.
// The source every other language translates (hi.ts); the namespace is defined in index.ts.

/** The shared texts, in English. `{name}` marks an ICU interpolation placeholder. */
const en = {
  errors: {
    unexpected: "Something went wrong. Try again; if it keeps happening, reload the page.",
    unreachable: "Can't reach {app} right now. Check your connection and try again.",
    unreadable: "The API sent an answer this app couldn't read.",
    requestFailed: "Request failed ({status})",
    emptyAnswer: "The API sent an empty answer ({status})",
  },
  retry: {
    tryAgain: "Try again",
    tryingAgain: "Trying again…",
    retry: "Retry",
  },
  refreshNotice: {
    stale: "Couldn't refresh, so this may be out of date: {message}",
  },
  placeholder: {
    comingSoon: "Coming soon",
  },
  theme: {
    change: "Change theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  ui: {
    close: "Close",
    toggleSidebar: "Toggle Sidebar",
    sidebarTitle: "Sidebar",
    sidebarDescription: "Displays the mobile sidebar.",
    resizePanels: "Resize panels",
    loading: "Loading",
  },
  toast: {
    titles: {
      success: "Done",
      error: "Error",
      warning: "Warning",
      info: "Notice",
    },
    dismiss: "Dismiss notification",
    region: "Notifications",
  },
  money: {
    inBase: "≈ {amount}",
    inBaseLabel: "{amount} in {currency}, at {rate} on {date}",
  },
  language: {
    change: "Change language",
    loadFailed: "Couldn't switch to {language}. Check your connection and try again.",
  },
  currency: {
    choose: "Choose currency",
  },
  timezone: {
    choose: "Choose timezone",
    searchPlaceholder: "Search city or region…",
    searchLabel: "Search timezones",
    listLabel: "Timezones",
    empty: "No matching timezones.",
  },
  monthPicker: {
    previous: "Previous month",
    next: "Next month",
    current: "This month",
  },
  datePicker: {
    placeholder: "Pick a date",
    today: "Today",
    now: "Now",
    clear: "Clear",
    done: "Done",
    time: "Time",
    hour: "Hour",
    minute: "Minute",
    second: "Second",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    previousYear: "Previous year",
    nextYear: "Next year",
    chooseMonth: "Choose month and year",
    backToCalendar: "Back to calendar",
    chooseDate: "Choose a date",
    chooseDateTime: "Choose a date and time",
    chooseTime: "Choose a time",
  },
}

export default en
