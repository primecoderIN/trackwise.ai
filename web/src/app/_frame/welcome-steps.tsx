"use client"

// Step sections for the first-run welcome stepper: language, default currency & timezone, optional budget with
// currency prefix, assistant starter prompts, and explicit Terms & Privacy consent. Part of app/_frame/.

import { Button, CheckboxBox, TextField } from "@primecoderin/fast-ui-react"
import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { ACCOUNT, BASE_CURRENCY } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { LabeledField } from "@/shared/components/labeled-field"
import { TimezonePicker } from "@/shared/components/timezone-picker"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES, LANGUAGES, type Language } from "@/shared/i18n"
import type { SupportedCurrency } from "@/shared/lib/currencies"

/** Step 1A: pick the app's initial UI and account language. */
export function WelcomeLanguageStep({
  selected,
  disabled,
  onSelect,
}: {
  selected: Language
  disabled: boolean
  onSelect: (code: Language) => void
}) {
  const t = useTranslations("app")
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-semibold text-fg">{t("welcome.stepLanguage")}</legend>
      <div className="flex flex-wrap gap-2">
        {LANGUAGE_CODES.map((code) => (
          <Button
            key={code}
            variant={selected === code ? "primary" : "secondary"}
            size="small"
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

/** Step 1B: pick default currency (from SUPPORTED_CURRENCIES) and searchable IANA timezone. */
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
  const t = useTranslations("app")
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="text-sm font-semibold text-fg">{t("welcome.stepRegion")}</legend>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <LabeledField id="welcome-currency" label={t("welcome.currencyLabel")}>
            <CurrencySelect
              id="welcome-currency"
              value={currency}
              onChange={onCurrencyChange}
              disabled={disabled}
              ariaLabel={t("welcome.currencyLabel")}
            />
          </LabeledField>
          <p className="text-xs leading-relaxed text-fg-secondary">
            {t("welcome.currencyHint", { baseCurrency: BASE_CURRENCY })}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <LabeledField id="welcome-timezone" label={t("welcome.timezoneLabel")}>
            <TimezonePicker
              id="welcome-timezone"
              value={timezone}
              onChange={onTimezoneChange}
              disabled={disabled}
              ariaLabel={t("welcome.timezoneLabel")}
            />
          </LabeledField>
          <p className="text-xs leading-relaxed text-fg-secondary">{t("welcome.timezoneHint")}</p>
        </div>
      </div>
    </fieldset>
  )
}

/** Step 2A: optional monthly budget (in BASE_CURRENCY) and starter assistant prompts. */
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
  const t = useTranslations("app")
  return (
    <>
      <TextField
        id="welcome-budget"
        label={t("welcome.stepBudget", { currency: BASE_CURRENCY })}
        hint={t("welcome.budgetHint")}
        inputMode="decimal"
        placeholder={t("welcome.budgetPlaceholder")}
        value={budgetLimit}
        onValueChange={onBudgetChange}
        contentBefore={<span className="text-xs font-semibold text-fg-secondary">{BASE_CURRENCY}</span>}
        size="small"
      />

      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-fg">{t("welcome.stepAssistant")}</p>
          <p className="text-xs text-fg-secondary">{t("welcome.assistantHint")}</p>
        </div>
        <div className="flex flex-col gap-2">
          {prompts.map((prompt, index) => {
            const active = selectedPromptIndex === index
            return (
              <button
                key={index}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectPrompt(active ? null : index)}
                className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-start text-xs transition-colors ${
                  active ? "border-primary-active bg-primary-light font-medium text-fg" : "border-line hover:bg-subtle"
                }`}
              >
                <Sparkles
                  className={`mt-0.5 size-3.5 shrink-0 ${active ? "text-primary-text" : "text-fg-secondary"}`}
                  aria-hidden="true"
                />
                <span>“{prompt}”</span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

/** Step 2B: explicit legal consent checkbox linking to Terms of Service and Privacy Policy. */
export function WelcomeTermsConsent({
  language,
  accepted,
  onChange,
}: {
  language: Language
  accepted: boolean
  onChange: (next: boolean) => void
}) {
  const t = useTranslations("app")
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-line bg-subtle p-3.5">
      <div className="mt-0.5">
        <CheckboxBox checked={accepted} onCheckedChange={onChange} aria-labelledby="welcome-terms-label" />
      </div>
      <div className="grid gap-1.5 leading-none">
        <span id="welcome-terms-label" className="text-xs leading-snug font-medium text-fg">
          {t("welcome.termsLabel", { version: ACCOUNT.currentTermsVersion })}
        </span>
        <div className="flex gap-3 text-xs text-fg-secondary">
          <Link href={localizedPath(ROUTES.terms, language)} className="underline underline-offset-2 hover:text-fg">
            {t("welcome.viewTerms")}
          </Link>
          <Link href={localizedPath(ROUTES.privacy, language)} className="underline underline-offset-2 hover:text-fg">
            {t("welcome.viewPrivacy")}
          </Link>
        </div>
      </div>
    </div>
  )
}
