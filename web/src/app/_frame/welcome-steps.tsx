// Step sections for the first-run welcome dialog: language, default currency & timezone, optional budget,
// assistant starter prompts, and Terms & Privacy consent. Part of app/_frame/. Used by welcome-dialog.tsx.

import Link from "next/link"

import { ACCOUNT, BASE_CURRENCY } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { TimezonePicker } from "@/shared/components/timezone-picker"
import { ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES, LANGUAGES, type Language } from "@/shared/i18n"
import type { SupportedCurrency } from "@/shared/lib/currencies"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { useTexts } from "../_i18n"

/** Step 1: pick the app's initial UI and account language. */
export function WelcomeLanguageStep({
  selected,
  disabled,
  onSelect,
}: {
  selected: Language
  disabled: boolean
  onSelect: (code: Language) => void
}) {
  const { t } = useTexts()
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium">{t("welcome.stepLanguage")}</legend>
      <div className="flex flex-wrap gap-2 pt-1">
        {LANGUAGE_CODES.map((code) => (
          <Button
            key={code}
            type="button"
            variant={selected === code ? "default" : "outline"}
            size="sm"
            lang={code}
            aria-pressed={selected === code}
            disabled={disabled}
            onClick={() => onSelect(code)}
          >
            {LANGUAGES[code].name}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}

/** Step 2: pick default currency (from SUPPORTED_CURRENCIES) and searchable IANA timezone. */
export function WelcomeRegionStep({
  currency,
  timezone,
  disabled,
  onCurrencyChange,
  onTimezoneChange,
}: {
  currency: SupportedCurrency
  timezone: string
  disabled: boolean
  onCurrencyChange: (next: SupportedCurrency) => void
  onTimezoneChange: (next: string) => void
}) {
  const { t } = useTexts()
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t("welcome.stepRegion")}</legend>
      <div className="grid gap-3 pt-1 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="welcome-currency" className="text-xs font-medium">
            {t("welcome.currencyLabel")}
          </Label>
          <CurrencySelect
            id="welcome-currency"
            value={currency}
            onChange={onCurrencyChange}
            disabled={disabled}
            ariaLabel={t("welcome.currencyLabel")}
          />
          <p className="text-xs text-muted-foreground">{t("welcome.currencyHint", { baseCurrency: BASE_CURRENCY })}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="welcome-timezone" className="text-xs font-medium">
            {t("welcome.timezoneLabel")}
          </Label>
          <TimezonePicker
            id="welcome-timezone"
            value={timezone}
            onChange={onTimezoneChange}
            disabled={disabled}
            ariaLabel={t("welcome.timezoneLabel")}
          />
          <p className="text-xs text-muted-foreground">{t("welcome.timezoneHint")}</p>
        </div>
      </div>
    </fieldset>
  )
}

/** Step 3 & Step 4: optional monthly budget (in BASE_CURRENCY) and starter assistant prompts. */
export function WelcomeExtrasSteps({
  budgetLimit,
  prompts,
  selectedPromptIndex,
  onBudgetChange,
  onSelectPrompt,
}: {
  budgetLimit: string
  prompts: readonly string[]
  selectedPromptIndex: number | null
  onBudgetChange: (next: string) => void
  onSelectPrompt: (index: number | null) => void
}) {
  const { t } = useTexts()
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="welcome-budget" className="text-sm font-medium">
          {t("welcome.stepBudget", { currency: BASE_CURRENCY })}
        </Label>
        <Input
          id="welcome-budget"
          inputMode="decimal"
          placeholder={t("welcome.budgetPlaceholder")}
          value={budgetLimit}
          onChange={(event) => onBudgetChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("welcome.budgetHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">{t("welcome.stepAssistant")}</p>
        <p className="text-xs text-muted-foreground">{t("welcome.assistantHint")}</p>
        <div className="flex flex-col gap-1.5">
          {prompts.map((prompt, index) => {
            const active = selectedPromptIndex === index
            return (
              <button
                key={index}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectPrompt(active ? null : index)}
                className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                  active ? "border-primary bg-primary/10 font-medium" : "hover:bg-accent/50"
                }`}
              >
                “{prompt}”
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

/** Legal consent checkbox linking to Terms of Service and Privacy Policy in the active language. */
export function WelcomeTermsConsent({
  language,
  accepted,
  onChange,
}: {
  language: Language
  accepted: boolean
  onChange: (next: boolean) => void
}) {
  const { t } = useTexts()
  return (
    <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3">
      <Checkbox id="welcome-terms" checked={accepted} onCheckedChange={(checked) => onChange(checked === true)} />
      <div className="grid gap-1 leading-none">
        <Label htmlFor="welcome-terms" className="text-xs font-normal leading-snug">
          {t("welcome.termsLabel", { version: ACCOUNT.currentTermsVersion })}
        </Label>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <Link href={language === "hi" ? ROUTES.termsHi : ROUTES.terms} className="underline hover:text-foreground">
            {t("welcome.viewTerms")}
          </Link>
          <Link
            href={language === "hi" ? ROUTES.privacyHi : ROUTES.privacy}
            className="underline hover:text-foreground"
          >
            {t("welcome.viewPrivacy")}
          </Link>
        </div>
      </div>
    </div>
  )
}
