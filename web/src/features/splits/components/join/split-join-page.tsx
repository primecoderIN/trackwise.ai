// Shared-group invite acceptance page (/splits/join/[token]): previews safe group metadata, offers clear
// guest-seat claiming ("Existing guest · Has previous split history") or joining as a new member / rejoining (D225).

import { CheckCircle2, RotateCcw, UserCheck, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { SectionError } from "@/shared/components/section-error"
import { ROUTES } from "@/shared/config/routes"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

import { useAcceptGroupInvite, useInvitePreview } from "../../queries"

/** Props for the Shared group invite join page. */
export interface SplitJoinPageProps {
  /** Raw invite token extracted from the dynamic route parameter `[token]`. */
  token: string
}

/** Previews a shared-group invite and atomically joins, rejoins, or claims an existing guest seat. */
export function SplitJoinPage({ token }: SplitJoinPageProps) {
  const t = useTranslations("splits")
  const router = useRouter()
  const messageOf = useMessageOf()
  const preview = useInvitePreview(token)
  const accept = useAcceptGroupInvite()

  async function handleAccept(claimMemberId?: number) {
    try {
      const result = await accept.mutateAsync({ token, claimMemberId })
      toast.success(t("join.joined", { name: preview.data?.group_name ?? "" }))
      router.push(`${ROUTES.splits}?group=${result.group_id}`)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  if (preview.isError) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-6">
        <SectionError
          title={t("join.loadFailed")}
          message={messageOf(preview.error)}
          onRetry={() => void preview.refetch()}
          retrying={preview.isFetching}
        />
        <Button asChild variant="outline" className="w-fit">
          <Link href={ROUTES.splits}>{t("join.backToSplits")}</Link>
        </Button>
      </div>
    )
  }

  if (!preview.data) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-6">
        <Skeleton className="h-48" />
      </div>
    )
  }

  const info = preview.data

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1">
              <Users className="size-3" />
              {t("groups.shared")}
            </Badge>
            <span className="text-xs text-muted-foreground">{t("join.memberCount", { count: info.member_count })}</span>
          </div>
          <CardTitle className="text-xl">{t("join.title", { name: info.group_name })}</CardTitle>
          <CardDescription>{t("join.subtitle")}</CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {info.already_member ? (
            <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                {t("join.alreadyMember")}
              </p>
              <Button disabled={accept.isPending} onClick={() => void handleAccept()}>
                {t("join.openGroup")}
              </Button>
            </div>
          ) : info.is_rejoin ? (
            <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4">
              <p className="text-sm">{t("join.rejoinNotice")}</p>
              <Button disabled={accept.isPending} onClick={() => void handleAccept()}>
                <RotateCcw className="size-4" />
                {accept.isPending ? t("join.joining") : t("join.rejoinAction")}
              </Button>
            </div>
          ) : info.target_guest ? (
            <div className="flex flex-col gap-3 rounded-md border p-4">
              <p className="text-sm font-medium">
                {t("join.targetSeatPrompt", { name: info.target_guest.display_name })}
              </p>
              <p className="text-xs text-muted-foreground">
                {info.target_guest.has_history ? t("join.guestHasHistory") : t("join.guestNoHistory")}
              </p>
              <Button disabled={accept.isPending} onClick={() => void handleAccept(info.target_guest!.member_id)}>
                <UserCheck className="size-4" />
                {accept.isPending ? t("join.joining") : t("join.claimSeat")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {info.claimable_guests.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{t("join.claimPrompt")}</p>
                  {info.claimable_guests.map((guest) => (
                    <div
                      key={guest.member_id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{guest.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {guest.has_history ? t("join.guestHasHistory") : t("join.guestNoHistory")}
                        </span>
                      </div>
                      <Button size="sm" disabled={accept.isPending} onClick={() => void handleAccept(guest.member_id)}>
                        <UserCheck className="size-3.5" />
                        {t("join.claimSeat")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed p-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{t("join.joinAsNew")}</span>
                  <span className="text-xs text-muted-foreground">{t("join.joinAsNewHint")}</span>
                </div>
                <Button
                  variant={info.claimable_guests.length > 0 ? "outline" : "default"}
                  size="sm"
                  disabled={accept.isPending}
                  onClick={() => void handleAccept()}
                >
                  <UserPlus className="size-3.5" />
                  {accept.isPending ? t("join.joining") : t("join.joinAsNew")}
                </Button>
              </div>
            </div>
          )}

          <Button asChild variant="ghost" size="sm" className="w-fit">
            <Link href={ROUTES.splits}>{t("join.backToSplits")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
