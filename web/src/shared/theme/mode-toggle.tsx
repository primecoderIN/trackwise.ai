"use client"

// The theme menu in the top bar: a sun/moon button that opens Light / Dark / System. Part of shared/theme. Used by
// app/_frame/app-layout.tsx (through shared/theme's index.ts).

import { Button, Menu, MenuRadioGroup, MenuRadioItem } from "@primecoderin/fast-ui-react"
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import { THEMES } from "./theme-constants"
import { useTheme, type Theme } from "./theme-context"

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value)
}

const CHOICES: { theme: Theme; icon: LucideIcon }[] = [
  { theme: "light", icon: Sun },
  { theme: "dark", icon: Moon },
  { theme: "system", icon: Monitor },
]

/**
 * The theme menu: Light, Dark, or System (follow the operating system). ThemeProvider saves the choice and
 * DesignSystemProvider sets `data-theme` on <html>.
 */
export function ModeToggle() {
  const { theme: current, setTheme } = useTheme()
  const t = useTranslations("common")

  return (
    <Menu
      align="end"
      trigger={
        <Button variant="icon" size="small" className="relative" aria-label={t("theme.change")}>
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      }
    >
      <MenuRadioGroup
        aria-label={t("theme.change")}
        value={current}
        onValueChange={(next) => {
          if (isTheme(next)) setTheme(next)
        }}
      >
        {CHOICES.map(({ theme, icon: Icon }) => (
          <MenuRadioItem key={theme} value={theme}>
            <span className="inline-flex items-center gap-2">
              <Icon className="size-4" aria-hidden="true" />
              {t(`theme.${theme}`)}
            </span>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </Menu>
  )
}
