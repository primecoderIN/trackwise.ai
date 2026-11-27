// Groups list view showing clear Personal vs. Shared visual badges and per-currency group balances (D225).

import { ChevronRight, Plus, User, Users } from "lucide-react"
import { useTranslations } from "next-intl"

import { EmptyState } from "@/shared/components/empty-state"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent } from "@/shared/ui/card"

import type { GroupSummary } from "../../api"

/** Props for the Groups list section. */
export interface GroupsListProps {
  groups: readonly GroupSummary[]
  onSelectGroup: (groupId: number) => void
  onNewGroup: () => void
}

/** Lists Personal and Shared groups with clear mode badges and independent per-currency balances. */
export function GroupsList({ groups, onSelectGroup, onNewGroup }: GroupsListProps) {
  const t = useTranslations("splits")
  const { formatMoney } = useFormatters()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{t("groups.title")}</h2>
        <Button size="sm" onClick={onNewGroup}>
          <Plus className="size-4" />
          {t("groups.newGroup")}
        </Button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("groups.emptyTitle")}
          message={t("groups.emptyDescription")}
          action={{ label: t("groups.newGroup"), onClick: onNewGroup }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id} className="transition-colors hover:bg-accent/30">
              <CardContent className="p-4">
                <button
                  type="button"
                  onClick={() => onSelectGroup(group.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">{group.name}</span>
                      <Badge variant={group.kind === "shared" ? "default" : "secondary"} className="gap-1 text-xs">
                        {group.kind === "shared" ? <Users className="size-3" /> : <User className="size-3" />}
                        {group.kind === "shared" ? t("groups.shared") : t("groups.personal")}
                      </Badge>
                      {group.archived_at && <Badge variant="outline">{t("groups.archivedBadge")}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("groups.memberCount", { count: group.member_count })}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-xs font-medium">
                      {group.my_balances.length === 0 ? (
                        <span className="text-muted-foreground">{t("groups.settled")}</span>
                      ) : (
                        group.my_balances.map((bal) => (
                          <span
                            key={bal.currency}
                            className={
                              bal.direction === "owed_to_you"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }
                          >
                            {bal.direction === "owed_to_you"
                              ? t("groups.owesYou", { amount: formatMoney(bal.amount, bal.currency) })
                              : t("groups.youOwe", { amount: formatMoney(bal.amount, bal.currency) })}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
