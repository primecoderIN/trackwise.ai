// The theme's provider: holds the chosen theme preference and persists changes to localStorage. Part of shared/theme.
// Used once, by app/_shell/providers.tsx, which passes the preference to DesignSystemProvider to apply `data-theme`.

import { useMemo, useState, type ReactNode } from "react"

import { THEME_STORAGE_KEY } from "./theme-constants"
import { readSavedTheme, ThemeContext, type Theme } from "./theme-context"

/**
 * Holds the current theme preference (starting from the saved one) and saves changes when storage allows.
 * DesignSystemProvider applies `data-theme` on <html> and follows the operating system live when set to "system".
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readSavedTheme)

  const value = useMemo(
    () => ({
      theme,
      setTheme(next: Theme) {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next)
        } catch {
          // Not saved (storage blocked), but still applied for this visit.
        }
        setThemeState(next)
      },
    }),
    [theme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
