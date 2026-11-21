"use client"

// Next.js's route error boundary for signed-in pages (app/(client)/(app)/error.tsx, Phase 28). Drawn in the app's style
// with a retry and a link back to the Dashboard. Only user-facing messages are shown (messageOf, D180).

import Link from "next/link"
import { useEffect } from "react"

import { useTexts } from "@/app/_i18n"
import { SectionError } from "@/shared/components/section-error"
import { ROUTES } from "@/shared/config/routes"
import { messageOf, reportUnexpected } from "@/shared/lib/errors"
import { Button } from "@/shared/ui/button"

/** Signed-in route segment error UI: shows SectionError with retry and a way back to the Dashboard. */
export default function SignedInError({ error, retry }: { error: unknown; retry: () => void }) {
  const { t } = useTexts()

  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  return (
    <div className="flex flex-col gap-3">
      <SectionError title={t("errors.page")} message={messageOf(error)} onRetry={() => retry()} />
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href={ROUTES.dashboard}>{t("errors.backHome")}</Link>
        </Button>
      </div>
    </div>
  )
}
