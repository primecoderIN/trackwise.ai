// What the "new access token" dialog shows once the token is made: the token itself, this once, with Copy. Part of the
// account feature (components/tokens/). Used by create-token-dialog.tsx, which forgets the token when the dialog
// closes. The token is never written to browser storage or a log: it lives in this dialog's memory only.

import { Button } from "@primecoderin/fast-ui-react"
import { toast } from "@/shared/lib/toast"
import { Copy } from "lucide-react"
import { useTranslations } from "next-intl"

interface TokenCreatedProps {
  /** The new token, as the server sent it. */
  token: string
}

/** The token in a read-only box (focusing it selects it all) with a Copy button. */
export function TokenCreated({ token }: TokenCreatedProps) {
  const t = useTranslations("account")

  // The clipboard can refuse (an insecure page, a denied permission): then the person copies it by hand.
  async function copy() {
    try {
      await navigator.clipboard.writeText(token)
      toast.success(t("newToken.copied"))
    } catch {
      toast.error(t("newToken.copyFailed"))
    }
  }

  return (
    <div className="grid gap-1.5">
      <label htmlFor="token-value" className="text-xs font-semibold text-fg">
        {t("newToken.token")}
      </label>
      <div className="flex gap-2">
        <input
          id="token-value"
          readOnly
          autoComplete="off"
          spellCheck={false}
          className="h-10 min-w-0 flex-1 rounded-md border border-line bg-subtle px-3 font-mono text-sm text-fg outline-none focus-visible:border-primary-active focus-visible:ring-2 focus-visible:ring-focus"
          value={token}
          onFocus={(event) => event.target.select()}
        />
        <Button variant="secondary" icon={<Copy />} onClick={() => void copy()}>
          {t("newToken.copy")}
        </Button>
      </div>
    </div>
  )
}
