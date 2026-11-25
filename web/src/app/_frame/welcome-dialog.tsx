"use client"

// The first-run welcome dialog (Phase 29 + globalization): shown once after a person's first sign-in (or when the
// current terms version hasn't been accepted yet), and persisted on the server (`welcomed_at`, `terms_version`,
// `preferred_language`, `default_currency`, `timezone`). Part of app/_frame/.

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

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
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"

import { WelcomeExtrasSteps, WelcomeLanguageStep, WelcomeRegionStep, WelcomeTermsConsent } from "./welcome-steps"

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
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const { language, setLanguage } = useLanguage()
  const completeWelcome = useCompleteWelcome()
  const setBudget = useSetBudget()
  const assistant = useAssistant()

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => initialWelcomeLanguage(user, language))
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(() => initialWelcomeCurrency(user))
  const [selectedTimezone, setSelectedTimezone] = useState<string>(() => initialWelcomeTimezone(user))
  const [budgetLimit, setBudgetLimit] = useState("")
  const [selectedPromptIndex, setSelectedPromptIndex] = useState<number | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(true)
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

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("welcome.title", { app: APP_NAME })}</DialogTitle>
          <DialogDescription>{t("welcome.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <WelcomeLanguageStep selected={selectedLanguage} disabled={busy} onSelect={chooseLanguage} />
          <WelcomeRegionStep
            currency={selectedCurrency}
            timezone={selectedTimezone}
            disabled={busy}
            onCurrencyChange={setSelectedCurrency}
            onTimezoneChange={setSelectedTimezone}
          />
          <WelcomeExtrasSteps
            budgetLimit={budgetLimit}
            prompts={prompts}
            selectedPromptIndex={selectedPromptIndex}
            onBudgetChange={setBudgetLimit}
            onSelectPrompt={setSelectedPromptIndex}
          />
          <WelcomeTermsConsent language={selectedLanguage} accepted={termsAccepted} onChange={setTermsAccepted} />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={!termsAccepted || busy}
            onClick={() => void handleFinish(true)}
          >
            {t("welcome.skip")}
          </Button>
          <Button type="button" disabled={!termsAccepted || busy} onClick={() => void handleFinish(false)}>
            {busy ? t("welcome.saving") : t("welcome.finish")}
          </Button>
        </DialogFooter>
      </DialogContent>
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
