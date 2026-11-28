"use client"

// The first-run welcome stepper dialog: splits onboarding into two focused steps
// (1: Language & Region, 2: Budget, Assistant & explicit Terms consent) persisted on the server. Part of app/_frame/.

import { Button, Dialog, useAppToast } from "@primecoderin/fast-ui-react"
import { ArrowLeft, ArrowRight, Wallet } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { useCompleteWelcome } from "@/features/account"
import { useAssistant } from "@/features/assistant"
import { useSignedInUser, type SignedInUser } from "@/features/auth"
import { useSetBudget } from "@/features/budgets"
import { ACCOUNT, DEFAULT_USER_CURRENCY } from "@/shared/api/contracts.gen"
import { APP_NAME } from "@/shared/config/app"
import { isLanguage, LANGUAGES, useLanguage, type Language } from "@/shared/i18n"
import { isSupportedCurrency, type SupportedCurrency } from "@/shared/lib/currencies"
import { detectBrowserTimezone } from "@/shared/lib/timezones"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import { WelcomeExtrasSteps, WelcomeLanguageStep, WelcomeRegionStep, WelcomeTermsConsent } from "./welcome-steps"

const TOTAL_STEPS = 2

function initialWelcomeLanguage(user: SignedInUser, activeLanguage: Language): Language {
  return user.welcomed_at != null && isLanguage(user.preferred_language) ? user.preferred_language : activeLanguage
}

function initialWelcomeCurrency(user: SignedInUser): SupportedCurrency {
  return isSupportedCurrency(user.default_currency) ? user.default_currency : DEFAULT_USER_CURRENCY
}

function initialWelcomeTimezone(user: SignedInUser): string {
  return user.welcomed_at != null && user.timezone ? user.timezone : detectBrowserTimezone()
}

function WelcomeDialogBody({
  user,
  onOpenChat,
  onDismiss,
}: {
  user: SignedInUser
  onOpenChat: () => void
  onDismiss: () => void
}) {
  const t = useTranslations("app")
  const tCommon = useTranslations("common")
  const toast = useAppToast()
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const { language, setLanguage } = useLanguage()
  const completeWelcome = useCompleteWelcome()
  const setBudget = useSetBudget()
  const assistant = useAssistant()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => initialWelcomeLanguage(user, language))
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(() => initialWelcomeCurrency(user))
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => initialWelcomeTimezone(user))
  const [budgetLimit, setBudgetLimit] = useState("")
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const alignedInitial = useRef(false)

  useEffect(() => {
    if (alignedInitial.current) return
    alignedInitial.current = true
    if (language !== selectedLanguage) void setLanguage(selectedLanguage).catch(() => undefined)
  }, [language, selectedLanguage, setLanguage])

  const busy = completeWelcome.isPending || setBudget.isPending
  const prompts = [t("welcome.prompt1", { amount: formatMoney("25", selectedCurrency) }), t("welcome.prompt2")]

  function chooseLanguage(code: Language) {
    setSelectedLanguage(code)
    if (code === language) return
    setLanguage(code).catch(() => toast.error(tCommon("language.loadFailed", { language: LANGUAGES[code].name })))
  }

  async function handleFinish(skipExtras: boolean) {
    if (!termsAccepted || busy) return
    try {
      const trimmedBudget = budgetLimit.trim()
      if (!skipExtras && trimmedBudget !== "" && Number(trimmedBudget) > 0) {
        await setBudget.mutateAsync({ scope: null, limit: trimmedBudget })
      }
      await completeWelcome.mutateAsync({
        terms_version: ACCOUNT.currentTermsVersion,
        preferred_language: selectedLanguage,
        default_currency: selectedCurrency,
        timezone: selectedTimezone,
      })
      onDismiss()
      const chosenPrompt = selectedPromptIndex !== null ? prompts[selectedPromptIndex] : null
      if (!skipExtras && chosenPrompt) {
        onOpenChat()
        assistant.send(chosenPrompt)
      }
    } catch (error) {
      toast.error(messageOf(error))
    }
  }

  const actions =
    step === 1 ? (
      <Button variant="primary" icon={<ArrowRight />} iconPosition="after" onClick={() => setStep(2)}>
        {t("welcome.next")}
      </Button>
    ) : (
      <>
        <Button variant="subtle" icon={<ArrowLeft />} disabled={busy} onClick={() => setStep(1)} className="me-auto">
          {t("welcome.back")}
        </Button>
        <Button variant="secondary" disabled={!termsAccepted || busy} onClick={() => void handleFinish(true)}>
          {t("welcome.skip")}
        </Button>
        <Button
          variant="primary"
          disabled={!termsAccepted || busy}
          isLoading={busy}
          onClick={() => void handleFinish(false)}
        >
          {busy ? t("welcome.saving") : t("welcome.finish")}
        </Button>
      </>
    )

  return (
    <Dialog
      open
      onOpenChange={() => {}}
      modalType="alert"
      size="narrow"
      icon={<Wallet />}
      eyebrow={t("welcome.stepOf", { step, total: TOTAL_STEPS })}
      title={t("welcome.title", { app: APP_NAME })}
      description={t("welcome.description")}
      actions={actions}
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className={`h-1.5 w-8 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <span className={`h-1.5 w-8 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>
        {step === 1 ? (
          <>
            <WelcomeLanguageStep selected={selectedLanguage} disabled={busy} onSelect={chooseLanguage} />
            <WelcomeRegionStep
              currency={selectedCurrency}
              timezone={selectedTimezone}
              disabled={busy}
              onCurrencyChange={setSelectedCurrency}
              onTimezoneChange={setSelectedTimezone}
            />
          </>
        ) : (
          <>
            <WelcomeExtrasSteps
              budgetLimit={budgetLimit}
              prompts={prompts}
              selectedPromptIndex={selectedPromptIndex}
              onBudgetChange={setBudgetLimit}
              onSelectPrompt={setSelectedPromptIndex}
            />
            <WelcomeTermsConsent language={selectedLanguage} accepted={termsAccepted} onChange={setTermsAccepted} />
          </>
        )}
      </div>
    </Dialog>
  )
}

/**
 * First-run welcome flow dialog: opens automatically when the signed-in user hasn't completed onboarding or accepted
 * the current terms version yet.
 */
export function WelcomeDialog({ onOpenChat }: { onOpenChat: () => void }) {
  const user = useSignedInUser().data
  const [dismissedForUser, setDismissedForUser] = useState<number | null>(null)

  if (!user) return null
  const needsWelcome = user.welcomed_at == null || user.terms_version !== ACCOUNT.currentTermsVersion
  if (!needsWelcome || dismissedForUser === user.id) return null

  return (
    <WelcomeDialogBody
      key={user.id}
      user={user}
      onOpenChat={onOpenChat}
      onDismiss={() => setDismissedForUser(user.id)}
    />
  )
}
