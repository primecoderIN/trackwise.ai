"use client"

// A shared component: the stand-in for a page that isn't built yet. Part of shared/.

import { useTranslations } from "next-intl"

import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

interface PlaceholderPageProps {
  /** The page's heading. */
  title: string
  /** What the page will hold, shown under "Coming soon". */
  description: string
}

/** A page that isn't built yet: its heading and a "Coming soon" card. Each placeholder passes its own text. */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  const t = useTranslations("common")
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("placeholder.comingSoon")}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
