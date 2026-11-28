// Suggested minimum-transfer settlements inside one group with one-click Settle Up and Remind/UPI QR buttons.

import { Button, Card } from "@primecoderin/fast-ui-react"
import { CardContent, CardHeader, CardTitle } from "@/shared/components/card-parts"
import { ArrowRight, HandCoins, QrCode } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"

import type { SimplifiedTransfer } from "../../api"

/** Props for the group's simplified settlements card. */
export interface SimplifiedTransfersProps {
  transfers: readonly SimplifiedTransfer[]
  archived: boolean
  onSettle: (transfer: SimplifiedTransfer) => void
  onRemind: (transfer: SimplifiedTransfer) => void
}

/** Shows minimum-cash-flow transfer suggestions per currency inside a single group. */
export function SimplifiedTransfers({ transfers, archived, onSettle, onRemind }: SimplifiedTransfersProps) {
  const t = useTranslations("splits")
  const { formatMoney } = useFormatters()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("groups.simplifiedTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("groups.simplifiedEmpty")}</p>
        ) : (
          <ul className="divide-y">
            {transfers.map((tr) => {
              const fromLabel = tr.from_is_self ? t("groups.youTag") : tr.from_name
              const toLabel = tr.to_is_self ? t("groups.youTag") : tr.to_name
              return (
                <li
                  key={`${tr.currency}-${tr.from_member_id}-${tr.to_member_id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium">{fromLabel}</span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{toLabel}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(tr.amount, tr.currency)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button size="small" variant="secondary" onClick={() => onRemind(tr)}>
                      <QrCode className="size-3.5" />
                      {t("people.remindOrPay")}
                    </Button>
                    {!archived && (
                      <Button variant="primary" size="small" onClick={() => onSettle(tr)}>
                        <HandCoins className="size-3.5" />
                        {t("page.settleUp")}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
