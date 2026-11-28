"use client"

// A shared component: the stand-in for a page that isn't built yet. Part of shared/.

import { Card } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"

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
      <h1 className="text-2xl font-semibold text-fg">{title}</h1>
      <Card>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-fg">{t("placeholder.comingSoon")}</h2>
          <p className="text-sm text-fg-secondary">{description}</p>
        </div>
      </Card>
    </div>
  )
}
