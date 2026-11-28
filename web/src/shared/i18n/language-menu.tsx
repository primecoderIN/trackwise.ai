"use client"

// The language menu in the top bar and sign-in screen: a button opening the list of languages in native script.

import { Button, Menu, MenuRadioGroup, MenuRadioItem, useAppToast } from "@primecoderin/fast-ui-react"
import { Languages } from "lucide-react"
import { useTranslations } from "next-intl"

import { isLanguage, LANGUAGE_CODES, LANGUAGES, type Language } from "./languages"
import { useLanguage } from "./use-language"

/**
 * The language menu. The chosen language is marked (a radio item, announced as checked). Choosing one loads its
 * texts if needed, redraws the app in it, saves the choice locally, and optionally notifies `onSelect` (so the
 * signed-in app frame can also persist it on the account). If texts can't be loaded, a toast says so and nothing
 * changes.
 */
export function LanguageMenu({ onSelect }: { onSelect?: (language: Language) => void }) {
  const t = useTranslations("common")
  const toast = useAppToast()
  const { language, setLanguage } = useLanguage()

  const choose = (value: string) => {
    if (!isLanguage(value) || value === language) return
    setLanguage(value)
      .then(() => onSelect?.(value))
      .catch(() => toast.error(t("language.loadFailed", { language: LANGUAGES[value].name })))
  }

  return (
    <Menu
      align="end"
      trigger={<Button variant="icon" size="small" icon={<Languages />} aria-label={t("language.change")} />}
    >
      <MenuRadioGroup aria-label={t("language.change")} value={language} onValueChange={choose}>
        {LANGUAGE_CODES.map((code) => (
          <MenuRadioItem key={code} value={code}>
            <span lang={code}>{LANGUAGES[code].name}</span>
          </MenuRadioItem>
        ))}
      </MenuRadioGroup>
    </Menu>
  )
}
