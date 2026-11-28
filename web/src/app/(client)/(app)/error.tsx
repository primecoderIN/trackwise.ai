"use client"

// Next.js's route error boundary for signed-in pages (app/(client)/(app)/error.tsx). Drawn in the app's style
// with a retry and a link back to the Dashboard. Only user-facing messages are shown (messageOf, D180).

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { linkButtonClass } from "@/shared/components/link-button"
import { SectionError } from "@/shared/components/section-error"
import { ROUTES } from "@/shared/config/routes"
import { reportUnexpected } from "@/shared/lib/errors"
import { useMessageOf } from "@/shared/lib/use-message-of"

/** Signed-in route segment error UI: shows SectionError with retry and a way back to the Dashboard. */
export default function SignedInError({ error, retry }: { error: unknown; retry: () => void }) {
  const t = useTranslations("app")
  const messageOf = useMessageOf()

  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  return (
    <div className="flex flex-col gap-3">
      <SectionError title={t("errors.page")} message={messageOf(error)} onRetry={() => retry()} />
      <div>
        <Link href={ROUTES.dashboard} className={linkButtonClass({ variant: "subtle", size: "small" })}>
          {t("errors.backHome")}
        </Link>
      </div>
    </div>
  )
}
