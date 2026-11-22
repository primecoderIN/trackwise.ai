// The first-run welcome dialog (Phase 29): shown once after a person's first sign-in (or when the current terms
// version hasn't been accepted yet), and stored on the server with the account (`welcomed_at`, `terms_version`, D192).
// Steps: choose the language, set an optional overall monthly budget, optionally try a sentence in the assistant, and
// accept the Terms of Service and Privacy Policy. Part of app/_frame/.

import Link from "next/link"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useCompleteWelcome } from "@/features/account"
import { useAssistant } from "@/features/assistant"
import { useSignedInUser } from "@/features/auth"
import { useSetBudget } from "@/features/budgets"
import { ACCOUNT, DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { isLanguage, LANGUAGE_CODES, LANGUAGES, useLanguage } from "@/shared/i18n"
import { messageOf } from "@/shared/lib/errors"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

import { useTexts } from "../_i18n"

/**
 * First-run welcome flow dialog: opens automatically when the signed-in user hasn't completed onboarding or accepted
 * the current terms version yet.
 */
export function WelcomeDialog({ onOpenChat }: { onOpenChat: () => void }) {
  const { t } = useTexts()
  const { t: tCommon } = useTranslation()
  const user = useSignedInUser().data
  const { language, setLanguage } = useLanguage()
  const completeWelcome = useCompleteWelcome()
  const setBudget = useSetBudget()
  const assistant = useAssistant()

  const [budgetLimit, setBudgetLimit] = useState("")
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [dismissedForUser, setDismissedForUser] = useState<number | null>(null)

  if (!user) return null
  const needsWelcome = user.welcomed_at == null || user.terms_version !== ACCOUNT.currentTermsVersion
  if (!needsWelcome || dismissedForUser === user.id) return null

  const busy = completeWelcome.isPending || setBudget.isPending
  const prompts = [t("welcome.prompt1"), t("welcome.prompt2")]

  function chooseLanguage(code: string) {
    if (!isLanguage(code) || code === language) return
    setLanguage(code).catch(() => toast.error(tCommon("language.loadFailed", { language: LANGUAGES[code].name })))
  }

  async function handleFinish(skipExtras: boolean) {
    if (!termsAccepted || busy || !user) return
    try {
      const trimmedBudget = budgetLimit.trim()
      if (!skipExtras && trimmedBudget !== "" && Number(trimmedBudget) > 0) {
        await setBudget.mutateAsync({ scope: null, limit: trimmedBudget })
      }
      await completeWelcome.mutateAsync({ terms_version: ACCOUNT.currentTermsVersion })
      setDismissedForUser(user.id)
      if (!skipExtras && selectedPrompt) {
        onOpenChat()
        assistant.send(selectedPrompt)
      }
    } catch (error) {
      toast.error(messageOf(error))
    }
  }

  return (
    <Dialog open>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("welcome.title", { app: APP_NAME })}</DialogTitle>
          <DialogDescription>{t("welcome.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium">{t("welcome.stepLanguage")}</legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {LANGUAGE_CODES.map((code) => (
                <Button
                  key={code}
                  type="button"
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="welcome-budget" className="text-sm font-medium">
              {t("welcome.stepBudget", { currency: DEFAULT_CURRENCY })}
            </Label>
            <Input
              id="welcome-budget"
              inputMode="decimal"
              placeholder={t("welcome.budgetPlaceholder")}
              value={budgetLimit}
              onChange={(event) => setBudgetLimit(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("welcome.budgetHint")}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">{t("welcome.stepAssistant")}</p>
            <p className="text-xs text-muted-foreground">{t("welcome.assistantHint")}</p>
            <div className="flex flex-col gap-1.5">
              {prompts.map((prompt) => {
                const active = selectedPrompt === prompt
                return (
                  <button
                    key={prompt}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedPrompt(active ? null : prompt)}
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

          <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3">
            <Checkbox
              id="welcome-terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <div className="grid gap-1 leading-none">
              <Label htmlFor="welcome-terms" className="text-xs font-normal leading-snug">
                {t("welcome.termsLabel", { version: ACCOUNT.currentTermsVersion })}
              </Label>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <Link
                  href={language === "hi" ? ROUTES.termsHi : ROUTES.terms}
                  className="underline hover:text-foreground"
                >
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
