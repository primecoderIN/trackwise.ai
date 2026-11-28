// Everything about themes that both the app and the document's <head> need. Part of shared/theme. No imports on
// purpose: the root layouts (rendered on the server) put THEME_BOOT_SCRIPT into <head>. Used by the theme's context
// and provider, and by the root layouts.

/** The themes: light, dark, or follow the operating system. */
export const THEMES = ["light", "dark", "system"] as const
/** One of THEMES. */
export type Theme = (typeof THEMES)[number]
/** The theme before anything is chosen (or when the saved choice can't be read): follow the system. */
export const DEFAULT_THEME: Theme = "system"
/** Where the choice is saved in localStorage. */
export const THEME_STORAGE_KEY = "spendwise-theme"
/** The attribute on <html> that @primecoderin/fast-ui-react and index.css switch colours on. */
export const THEME_ATTRIBUTE = "data-theme"
/** The media query that's true while the operating system is set to dark. */
export const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)"

/**
 * A script that runs before the page is painted, so dark mode doesn't flash light first. Built from the values
 * above, so it agrees with DesignSystemProvider when React hydrates.
 */
export const THEME_BOOT_SCRIPT = `try {
  const saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})
  const theme = ${JSON.stringify(THEMES)}.includes(saved) ? saved : ${JSON.stringify(DEFAULT_THEME)}
  const dark = theme === "dark" || (theme === "system" && matchMedia(${JSON.stringify(PREFERS_DARK_QUERY)}).matches)
  document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)}, dark ? "dark" : "light")
} catch {}`
