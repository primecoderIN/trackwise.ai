"use client"

// Step sections for the first-run welcome stepper: language, default currency & timezone, optional budget with
// currency prefix, assistant starter prompts, and explicit Terms & Privacy consent. Part of app/_frame/.

import { Sparkles } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"

import { ACCOUNT, BASE_CURRENCY } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { TimezonePicker } from "@/shared/components/timezone-picker"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { LANGUAGE_CODES, LANGUAGES, type Language } from "@/shared/i18n"
import type { SupportedCurrency } from "@/shared/lib/currencies"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

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
      <legend className="text-sm font-semibold">{t("welcome.stepLanguage")}</legend>
      <div className="flex flex-wrap gap-2">
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
      <legend className="text-sm font-semibold">{t("welcome.stepRegion")}</legend>
      <div className="grid gap-3.5 sm:grid-cols-2">
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
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("welcome.currencyHint", { baseCurrency: BASE_CURRENCY })}
          </p>
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
          <p className="text-xs leading-relaxed text-muted-foreground">{t("welcome.timezoneHint")}</p>
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="welcome-budget" className="text-sm font-semibold">
          {t("welcome.stepBudget", { currency: BASE_CURRENCY })}
        </Label>
        <div className="relative">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground"
          >
            {BASE_CURRENCY}
          </span>
          <Input
            id="welcome-budget"
            inputMode="decimal"
            placeholder={t("welcome.budgetPlaceholder")}
            value={budgetLimit}
            onChange={(event) => onBudgetChange(event.target.value)}
            className="pl-12 tabular-nums"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("welcome.budgetHint")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold">{t("welcome.stepAssistant")}</p>
          <p className="text-xs text-muted-foreground">{t("welcome.assistantHint")}</p>
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
                className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors ${
                  active ? "border-primary bg-primary/8 font-medium text-foreground" : "hover:bg-muted/60"
                }`}
              >
                <Sparkles
                  className={`mt-0.5 size-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`}
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
    <div className="flex items-start gap-2.5 rounded-xl border bg-muted/35 p-3.5">
      <Checkbox
        id="welcome-terms"
        checked={accepted}
        onCheckedChange={(checked) => onChange(checked === true)}
        className="mt-0.5"
      />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor="welcome-terms" className="text-xs font-medium leading-snug">
          {t("welcome.termsLabel", { version: ACCOUNT.currentTermsVersion })}
        </Label>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <Link
            href={localizedPath(ROUTES.terms, language)}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t("welcome.viewTerms")}
          </Link>
          <Link
            href={localizedPath(ROUTES.privacy, language)}
            className="underline underline-offset-2 hover:text-foreground"
          >
            {t("welcome.viewPrivacy")}
          </Link>
        </div>
      </div>
    </div>
  )
}
