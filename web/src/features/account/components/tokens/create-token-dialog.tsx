// The "New token" button and its dialog: first the form, then, once the token is made, the token itself, shown this
// once. Part of the account feature (components/tokens/). Used by tokens-card.tsx.

import { Button, Dialog } from "@primecoderin/fast-ui-react"
import { toast } from "@/shared/lib/toast"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, type FormEvent } from "react"

import { useMessageOf } from "@/shared/lib/use-message-of"

import type { NewAccessToken } from "../../api"
import { useCreateAccessToken } from "../../queries"
import { BLANK_TOKEN, isComplete } from "../../token-form"
import { TokenCreated } from "./token-created"
import { TokenFields } from "./token-fields"

const FORM_ID = "create-token-form"

/**
 * Makes a token. The token is kept only in this dialog's state while it's open: closing the dialog forgets it (and
 * the request's answer), so it can't be read again afterwards, by anyone. While it's on screen a click outside
 * doesn't close the dialog, so it isn't lost by accident before it's copied.
 */
export function CreateTokenDialog() {
  const t = useTranslations("account")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<NewAccessToken>(BLANK_TOKEN)
  const [token, setToken] = useState<string | null>(null)
  const create = useCreateAccessToken()

  function close() {
    setOpen(false)
    setDraft(BLANK_TOKEN)
    setToken(null)
    create.reset()
  }

  function handleOpenChange(next: boolean) {
    if (next) {
      setOpen(true)
      return
    }
    if (token !== null || create.isPending) return
    close()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault() // stop the browser's default form submit, which would reload the page
    if (create.isPending || !draft.name.trim()) return
    create.mutate(
      { ...draft, name: draft.name.trim() },
      // e.g. "You can have at most 10 access tokens", straight from the backend's rules. The dialog stays open.
      { onSuccess: (created) => setToken(created.token), onError: (error) => toast.error(messageOf(error)) },
    )
  }

  const actions =
    token !== null ? (
      <Button variant="primary" onClick={close}>
        {t("newToken.done")}
      </Button>
    ) : (
      <>
        <Button variant="secondary" onClick={close} disabled={create.isPending}>
          {t("actions.cancel")}
        </Button>
        <Button
          variant="primary"
          type="submit"
          form={FORM_ID}
          disabled={!isComplete(draft)}
          isLoading={create.isPending}
        >
          {create.isPending ? t("newToken.creating") : t("newToken.create")}
        </Button>
      </>
    )

  return (
    <>
      <Button variant="primary" size="small" icon={<Plus />} onClick={() => setOpen(true)}>
        {t("tokens.create")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={handleOpenChange}
        modalType={token !== null || create.isPending ? "alert" : "modal"}
        size="narrow"
        title={token !== null ? t("newToken.createdTitle") : t("newToken.title")}
        description={token !== null ? t("newToken.createdDescription") : t("newToken.description")}
        closeLabel={token === null && !create.isPending ? tCommon("ui.close") : undefined}
        actions={actions}
      >
        {token !== null ? (
          <TokenCreated token={token} />
        ) : (
          <TokenFields formId={FORM_ID} draft={draft} onChange={setDraft} onSubmit={handleSubmit} />
        )}
      </Dialog>
    </>
  )
}
