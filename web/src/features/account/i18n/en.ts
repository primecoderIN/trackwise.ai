// The "account" namespace's English texts: the Settings page (profile, where you're signed in, access tokens). Part
// of the account feature (i18n/). The source other languages translate (hi.ts); index.ts defines the namespace.

/** The account feature's texts, in English. `{name}` marks an ICU interpolation placeholder. */
const en = {
  page: {
    title: "Settings",
    description: "Your profile, display preferences, signed-in browsers, and developer access.",
  },
  sections: {
    label: "Settings sections",
    profile: "Profile",
    preferences: "Preferences",
    security: "Security",
    developer: "Developer",
  },
  profile: {
    title: "Profile",
    description: "Your name, email and picture come from the account you sign in with.",
    you: "Your account",
    noEmail: "No email address",
    termsAccepted: "Terms & Privacy ({version}) accepted on {date}",
  },
  preferences: {
    title: "Preferences",
    description: "Choose your language, default currency, timezone, and theme.",
    languageTitle: "Language",
    languageDescription: "Menus, pages, error messages and assistant replies appear in this language.",
    currencyTitle: "Default currency",
    currencyDescription:
      "Pre-selected when adding expenses or asking the assistant. Totals and budgets are tracked in {baseCurrency}.",
    timezoneTitle: "Timezone",
    timezoneDescription: "Used for today's date, monthly summaries, budgets, and reports.",
    useBrowserTimezone: "Use browser timezone ({zone})",
    themeTitle: "Theme",
    themeDescription: "Switch between light and dark mode, or follow your device (saved on this browser).",
    saved: "Preferences saved.",
  },
  sessions: {
    title: "Where you're signed in",
    description: "Every browser signed in to your account. To sign out of this one, use the menu at the top right.",
    loadFailed: "Couldn't load where you're signed in",
    // A browser and its system, e.g. "Edge on Windows" (both are product names, not translated).
    deviceOn: "{browser} on {system}",
    unknownDevice: "Unknown browser",
    thisBrowser: "This browser",
    times: "Signed in {signedIn} · Last active {lastActive}",
    signOut: "Sign out",
    // What a screen reader says for a row's Sign out button.
    signOutLabel: "Sign out {device}, signed in {signedIn}",
    signedOut: "That browser is signed out.",
    signOutOthers: "Sign out everywhere else",
    signOutOthersTitle: "Sign out everywhere else?",
    signOutOthersDescription:
      "Every other browser signed in to your account will be signed out. This one stays signed in.",
    othersSignedOut: "Every other browser is signed out.",
  },
  tokens: {
    title: "Access tokens",
    description:
      "A token lets another app (an MCP client, such as a desktop assistant) read and change your expenses as you. " +
      "Treat it like a password.",
    loadFailed: "Couldn't load your access tokens",
    none: "No access tokens yet.",
    create: "New token",
    endsWith: "Ends with {hint}",
    dates: "Created {created} · Expires {expires}",
    lastUsed: "Last used {when}",
    neverUsed: "Never used",
    expired: "Expired",
    revoke: "Revoke",
    // What a screen reader says for a row's Revoke button.
    revokeLabel: "Revoke the token {name}",
    revokeTitle: "Revoke this token?",
    revokeDescription: "Apps using “{name}” will stop working at once. This can't be undone.",
    revoked: "The token is revoked.",
  },
  newToken: {
    title: "New access token",
    description: "Name it after the app that will use it, so you can tell your tokens apart.",
    name: "Name",
    nameExample: "e.g. Desktop assistant",
    lifetime: "Expires after",
    days: "{count, plural, one {# day} other {# days}}",
    create: "Create token",
    creating: "Creating…",
    createdTitle: "Copy your token now",
    createdDescription:
      "This is the only time it's shown. Keep it somewhere safe: anyone who has it can read and change your expenses.",
    token: "Your new token",
    copy: "Copy",
    copied: "Copied to the clipboard.",
    copyFailed: "Couldn't copy it. Select the token and copy it yourself.",
    done: "Done",
  },
  actions: {
    cancel: "Cancel",
  },
}

export default en
