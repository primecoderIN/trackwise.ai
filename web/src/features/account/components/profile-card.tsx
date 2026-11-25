// The Settings page's profile: who is signed in (picture or initials, name, email). Part of the account feature
// (components/). The person comes from the auth feature (the same answer the top bar's menu shows), and nothing here
// can be edited: the profile is the identity provider's, refreshed at each sign-in.

import { useTranslations } from "next-intl"

import { UserAvatar, useSignedInUser } from "@/features/auth"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

/** The signed-in person's picture, name and email. Nothing while nobody is signed in (the page is behind the gate). */
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
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <UserAvatar name={name} picture={user.avatar_url} size="large" />
          <div className="min-w-0">
            <p className="truncate font-medium">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email ?? t("profile.noEmail")}</p>
          </div>
        </div>
        {user.terms_version && user.terms_accepted_at && (
          <p className="text-xs text-muted-foreground">
            {t("profile.termsAccepted", {
              version: user.terms_version,
              date: formatDate(user.terms_accepted_at),
            })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
