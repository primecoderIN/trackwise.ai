// One row of "Access tokens": token icon tile, name, monospace hint badge, compact lifecycle timestamps, and Revoke.
// Part of the account feature (components/tokens/). Used by tokens-card.tsx.

import { Button, StatusBadge, Tag } from "@primecoderin/fast-ui-react"
import { toast } from "@/shared/lib/toast"
import { KeyRound } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { AccessToken } from "../../api"
import { useRevokeAccessToken } from "../../queries"
import { ConfirmDialog } from "../confirm-dialog"

/**
 * One access token row with expiry badge, monospace hint tag, usage timestamps, and destructive-hover Revoke action.
 */
export function TokenRow({ token }: { token: AccessToken }) {
  const t = useTranslations("account")
  const messageOf = useMessageOf()
  const { formatDateTime } = useFormatters()
  const revoke = useRevokeAccessToken()
  const [confirming, setConfirming] = useState(false)
  const dates = { created: formatDateTime(token.created_at), expires: formatDateTime(token.expires_at) }

  function handleRevoke() {
    revoke.mutate(token.id, {
      onSuccess: () => toast.success(t("tokens.revoked")),
      onError: (error) => toast.error(messageOf(error)),
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3.5 py-3.5 first:pt-1 last:pb-1">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          token.expired ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
        }`}
      >
        <KeyRound aria-hidden="true" className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{token.name}</span>
          <Tag className="font-mono text-[11px]">{t("tokens.endsWith", { hint: token.hint })}</Tag>
          {token.expired && <StatusBadge tone="error">{t("tokens.expired")}</StatusBadge>}
        </div>
        <p>{t("tokens.dates", dates)}</p>
        <p>
          {token.last_used_at
            ? t("tokens.lastUsed", { when: formatDateTime(token.last_used_at) })
            : t("tokens.neverUsed")}
        </p>
      </div>
      <Button
        variant="secondary"
        size="small"
        disabled={revoke.isPending}
        aria-label={t("tokens.revokeLabel", { name: token.name })}
        onClick={() => setConfirming(true)}
        className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
      >
        {t("tokens.revoke")}
      </Button>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={t("tokens.revokeTitle")}
        description={t("tokens.revokeDescription", { name: token.name })}
        confirmLabel={t("tokens.revoke")}
        onConfirm={handleRevoke}
      />
    </li>
  )
}
