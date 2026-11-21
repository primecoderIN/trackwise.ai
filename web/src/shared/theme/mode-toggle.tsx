// The theme menu in the top bar: a sun/moon button that opens Light / Dark / System. Part of shared/theme. Used by
// app/_frame/app-layout.tsx (through shared/theme's index.ts).

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"

import { THEMES } from "./theme-constants"
import { useTheme, type Theme } from "./theme-context"

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value)
}

// The menu's entries, in order: each theme with its icon. Its label is the common text "theme.<theme>", looked up
// when the menu is drawn, so it follows the language.
const CHOICES: { theme: Theme; icon: LucideIcon }[] = [
  { theme: "light", icon: Sun },
  { theme: "dark", icon: Moon },
  { theme: "system", icon: Monitor },
]

/**
 * The theme menu: Light, Dark, or System (follow the operating system). ThemeProvider saves the choice and puts a
 * "dark" class on <html>; the colours in index.css switch on that class.
 */
export function ModeToggle() {
  const { theme: current, setTheme } = useTheme()
  const { t } = useTranslation()

  // The button holds both the sun and the moon; CSS (the dark: variants) shows the right one, so there's no flicker
  // on load, before React knows the theme.
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("theme.change")}>
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(next) => {
            if (isTheme(next)) setTheme(next)
          }}
        >
          {CHOICES.map(({ theme, icon: Icon }) => (
            <DropdownMenuRadioItem key={theme} value={theme}>
              <Icon /> {t(`theme.${theme}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
