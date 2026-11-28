// The "new access token" form fields: a name and how long the token should work. Part of the account feature
// (components/tokens/). Used by create-token-dialog.tsx, which owns the draft, the dialog around it and the buttons.

import { SelectField, TextField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { useMemo, type FormEvent } from "react"

import { ACCOUNT } from "@/shared/api/contracts.gen"

import type { NewAccessToken } from "../../api"
import { isTokenLifetime, TOKEN_LIFETIMES } from "../../token-form"

interface TokenFieldsProps {
  /** The `id` of the form, so the dialog's Create button (outside the form) can submit it. */
  formId: string
  /** The form's values so far. */
  draft: NewAccessToken
  /** Called with the whole draft whenever a field changes. */
  onChange: (draft: NewAccessToken) => void
  /** Create was pressed (or Enter in the name box). */
  onSubmit: (event: FormEvent) => void
}

/**
 * The form. The name is capped at the server's limit as it's typed, and the lifetimes are the server's own list, so
 * what can be sent is what the server accepts; the server still checks both.
 */
export function TokenFields({ formId, draft, onChange, onSubmit }: TokenFieldsProps) {
  const t = useTranslations("account")
  const lifetimes = useMemo<SelectOption[]>(
    () => TOKEN_LIFETIMES.map((days) => ({ value: String(days), label: t("newToken.days", { count: days }) })),
    [t],
  )

  // The select reports plain text: only a lifetime on offer is taken.
  function setLifetime(value: string) {
    const days = Number(value)
    if (isTokenLifetime(days)) onChange({ ...draft, lifetime_days: days })
  }

  return (
    <form id={formId} onSubmit={onSubmit} className="grid gap-4">
      <TextField
        label={t("newToken.name")}
        autoComplete="off"
        maxLength={ACCOUNT.tokenNameLength}
        placeholder={t("newToken.nameExample")}
        value={draft.name}
        onValueChange={(name) => onChange({ ...draft, name })}
      />
      <SelectField
        label={t("newToken.lifetime")}
        options={lifetimes}
        value={String(draft.lifetime_days)}
        onValueChange={setLifetime}
      />
    </form>
  )
}
