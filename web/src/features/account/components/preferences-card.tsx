// The Settings page's Preferences section: language and theme selection. Part of the account feature (components/).
// Used by settings-page.tsx (Phase 28).

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { isLanguage, LANGUAGE_CODES, LANGUAGES, useLanguage } from "@/shared/i18n"
import { useTheme, type Theme } from "@/shared/theme"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

import { useTexts } from "../i18n"

const THEME_CHOICES: { theme: Theme; icon: LucideIcon }[] = [
  { theme: "light", icon: Sun },
  { theme: "dark", icon: Moon },
  { theme: "system", icon: Monitor },
]

/** Preferences card: choose the app's language and colour theme. */
export function PreferencesCard() {
  const { t } = useTexts()
  const { t: tCommon } = useTranslation()
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()

  function chooseLanguage(code: string) {
    if (!isLanguage(code) || code === language) return
    setLanguage(code).catch(() => toast.error(tCommon("language.loadFailed", { language: LANGUAGES[code].name })))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("preferences.title")}</CardTitle>
        <CardDescription>{t("preferences.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("preferences.languageTitle")}</legend>
          <p className="text-xs text-muted-foreground">{t("preferences.languageDescription")}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {LANGUAGE_CODES.map((code) => (
              <Button
                key={code}
                variant={language === code ? "default" : "outline"}
                size="sm"
                lang={code}
                aria-pressed={language === code}
                onClick={() => chooseLanguage(code)}
              >
                {LANGUAGES[code].name}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("preferences.themeTitle")}</legend>
          <p className="text-xs text-muted-foreground">{t("preferences.themeDescription")}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {THEME_CHOICES.map(({ theme: choice, icon: Icon }) => (
              <Button
                key={choice}
                variant={theme === choice ? "default" : "outline"}
                size="sm"
                aria-pressed={theme === choice}
                onClick={() => setTheme(choice)}
              >
                <Icon className="size-4" />
                {tCommon(`theme.${choice}`)}
              </Button>
            ))}
          </div>
        </fieldset>
      </CardContent>
    </Card>
  )
}
