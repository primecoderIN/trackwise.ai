// Top balance summary strip for the Splits page: displays per-currency directional obligations ("You are owed" vs.
// "You owe") separately using semantic positive/warning tokens — never mixing currencies or netting across groups.

import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { useTranslations } from "next-intl"

import { useFormatters } from "@/shared/lib/use-formatters"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

import type { OverviewCurrencyTotal } from "../../api"

/** Props for the per-currency directional balance summary strip. */
export interface BalanceStripProps {
  totals: readonly OverviewCurrencyTotal[]
}

/** Shows non-netted per-currency directional totals across direct splits and groups. */
export function BalanceStrip({ totals }: BalanceStripProps) {
  const t = useTranslations("splits")
  const { formatMoney } = useFormatters()

  const owedItems = totals.filter((row) => row.owed_to_you_minor > 0)
  const oweItems = totals.filter((row) => row.you_owe_minor > 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("summary.owedToYou")}
            </CardTitle>
            <span className="flex size-9 items-center justify-center rounded-xl bg-positive-soft text-positive-foreground">
              <ArrowDownLeft className="size-4" aria-hidden="true" />
            </span>
          </CardHeader>
          <CardContent>
            {owedItems.length === 0 ? (
              <p className="text-lg font-semibold text-muted-foreground">{t("summary.allSettled")}</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {owedItems.map((row) => (
                  <span
                    key={row.currency}
                    className="text-2xl font-bold tracking-tight text-positive-foreground tabular-nums"
                  >
                    {formatMoney(row.owed_to_you, row.currency)}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t("summary.youOwe")}
            </CardTitle>
            <span className="flex size-9 items-center justify-center rounded-xl bg-warning-soft text-warning-foreground">
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </CardHeader>
          <CardContent>
            {oweItems.length === 0 ? (
              <p className="text-lg font-semibold text-muted-foreground">{t("summary.allSettled")}</p>
            ) : (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {oweItems.map((row) => (
                  <span
                    key={row.currency}
                    className="text-2xl font-bold tracking-tight text-warning-foreground tabular-nums"
                  >
                    {formatMoney(row.you_owe, row.currency)}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">{t("summary.separateHint")}</p>
    </div>
  )
}
