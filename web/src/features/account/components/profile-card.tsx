// The Settings page's profile card: who is signed in (elevated avatar, name, email, and terms acceptance badge).
// Part of the account feature (components/).

import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { UserAvatar, useSignedInUser } from "@/features/auth"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Badge } from "@/shared/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

/** The signed-in person's picture, name, email, and terms acceptance badge. Nothing while nobody is signed in. */
export function ProfileCard() {
  const t = useTranslations("account")
  const { formatDate } = useFormatters()
  const user = useSignedInUser().data
  if (!user) return null
  const name = user.name ?? user.email ?? t("profile.you")

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile.title")}</CardTitle>
        <CardDescription>{t("profile.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 bg-muted/25 p-4">
          <div className="shrink-0 rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
            <UserAvatar name={name} picture={user.avatar_url} size="large" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight text-foreground">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email ?? t("profile.noEmail")}</p>
          </div>
        </div>
        {user.terms_version && user.terms_accepted_at && (
          <div>
            <Badge variant="positive" className="h-auto gap-1.5 py-1 whitespace-normal">
              <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
              <span>
                {t("profile.termsAccepted", {
                  version: user.terms_version,
                  date: formatDate(user.terms_accepted_at),
                })}
              </span>
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
