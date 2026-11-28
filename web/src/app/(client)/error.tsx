"use client"

// Root error boundary for the `(client)` workspace group. Catches unexpected errors below `(client)/layout.tsx`.

import { Button, Card } from "@primecoderin/fast-ui-react"
import { RefreshCw } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

import { linkButtonClass } from "@/shared/components/link-button"
import { APP_NAME } from "@/shared/config/app"
import { ROUTES } from "@/shared/config/routes"
import { reportUnexpected } from "@/shared/lib/errors"
import { useMessageOf } from "@/shared/lib/use-message-of"

/** Route segment error fallback for workspace routes. */
export default function ClientRouteError({ error, retry }: { error: unknown; retry: () => void }) {
  const tApp = useTranslations("app")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()

  useEffect(() => {
    reportUnexpected(error)
  }, [error])

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6 pt-12">
      <Card role="alert" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-semibold text-fg">{tApp("errors.app", { app: APP_NAME })}</h1>
          <p className="text-sm text-fg-secondary">{messageOf(error)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="small" icon={<RefreshCw />} onClick={() => retry()}>
            {tCommon("retry.tryAgain")}
          </Button>
          <Link href={ROUTES.dashboard} className={linkButtonClass({ variant: "subtle", size: "small" })}>
            {tApp("errors.backHome")}
          </Link>
        </div>
      </Card>
    </main>
  )
}
