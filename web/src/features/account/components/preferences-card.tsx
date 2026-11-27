// The Settings page's Preferences section: account-synced language, default currency, and timezone, plus
// browser-local theme selection. Part of the account feature (components/). Used by settings-page.tsx.

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo } from "react"
import { toast } from "sonner"

import { useSignedInUser } from "@/features/auth"
import { BASE_CURRENCY, DEFAULT_TIMEZONE, DEFAULT_USER_CURRENCY } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { TimezonePicker } from "@/shared/components/timezone-picker"
import { isLanguage, LANGUAGE_CODES, LANGUAGES, useLanguage } from "@/shared/i18n"
import { isSupportedCurrency, type SupportedCurrency } from "@/shared/lib/currencies"
import { detectBrowserTimezone } from "@/shared/lib/timezones"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { useTheme, type Theme } from "@/shared/theme"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Label } from "@/shared/ui/label"

import { useUpdatePreferences } from "../queries"

const THEME_CHOICES: { theme: Theme; icon: LucideIcon }[] = [
  { theme: "light", icon: Sun },
  { theme: "dark", icon: Moon },
  { theme: "system", icon: Monitor },
]

function CurrencyAndTimezoneFields({
  currency,
  timezone,
  browserZone,
  disabled,
  onCurrencyChange,
  onTimezoneChange,
}: {
  currency: string
  timezone: string
  browserZone: string
  disabled: boolean
  onCurrencyChange: (next: SupportedCurrency) => void
  onTimezoneChange: (next: string) => void
}) {
  const t = useTranslations("account")
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="pref-currency" className="text-sm font-medium">
          {t("preferences.currencyTitle")}
        </Label>
        <p className="text-xs text-muted-foreground">
          {t("preferences.currencyDescription", { baseCurrency: BASE_CURRENCY })}
        </p>
        <div className="pt-1">
          <CurrencySelect
            id="pref-currency"
            value={currency}
            onChange={onCurrencyChange}
            disabled={disabled}
            ariaLabel={t("preferences.currencyTitle")}
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="pref-timezone" className="text-sm font-medium">
          {t("preferences.timezoneTitle")}
        </Label>
        <p className="text-xs text-muted-foreground">{t("preferences.timezoneDescription")}</p>
        <div className="flex flex-col items-start gap-1.5 pt-1">
          <TimezonePicker
            id="pref-timezone"
            value={timezone}
            onChange={onTimezoneChange}
            disabled={disabled}
            ariaLabel={t("preferences.timezoneTitle")}
          />
          {browserZone !== timezone && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              disabled={disabled}
              onClick={() => onTimezoneChange(browserZone)}
            >
              {t("preferences.useBrowserTimezone", { zone: browserZone })}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Preferences card: choose account language, default currency, timezone, and browser theme. */
export function PreferencesCard() {
  const t = useTranslations("account")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const user = useSignedInUser().data
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const updatePreferences = useUpdatePreferences()
  const browserZone = useMemo(() => detectBrowserTimezone(), [])

  const currency = isSupportedCurrency(user?.default_currency) ? user.default_currency : DEFAULT_USER_CURRENCY
  const timezone = user?.timezone ?? DEFAULT_TIMEZONE
  const busy = updatePreferences.isPending

  async function save(body: Parameters<typeof updatePreferences.mutateAsync>[0]) {
    try {
      await updatePreferences.mutateAsync(body)
      toast.success(t("preferences.saved"))
    } catch (error) {
      toast.error(messageOf(error))
    }
  }

  function chooseLanguage(code: string) {
    if (!isLanguage(code) || code === language) return
    setLanguage(code)
      .then(() => save({ preferred_language: code }))
      .catch(() => toast.error(tCommon("language.loadFailed", { language: LANGUAGES[code].name })))
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
                disabled={busy}
                onClick={() => chooseLanguage(code)}
              >
                {LANGUAGES[code].name}
              </Button>
            ))}
          </div>
        </fieldset>

        <CurrencyAndTimezoneFields
          currency={currency}
          timezone={timezone}
          browserZone={browserZone}
          disabled={busy}
          onCurrencyChange={(next) => next !== currency && void save({ default_currency: next })}
          onTimezoneChange={(next) => next !== timezone && void save({ timezone: next })}
        />

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
