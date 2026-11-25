"use client"

// What the outermost error boundary shows when something outside the page and the chat crashes (the sidebar, a
// provider). Part of the app composition (app/). Used by client-root.tsx.

import { useTranslations } from "next-intl"

import { SectionError } from "@/shared/components/section-error"
import { APP_NAME } from "@/shared/config/app"
import { useMessageOf } from "@/shared/lib/use-message-of"

/**
 * Say what happened and offer a way back, instead of a blank window. "Try again" reloads the whole window, which
 * starts every provider afresh, rather than redrawing the same broken tree.
 */
export function AppCrashed({ error }: { error: Error }) {
  const t = useTranslations("app")
  const messageOf = useMessageOf()
  return (
    <div className="p-6">
      <SectionError
        title={t("errors.app", { app: APP_NAME })}
        message={messageOf(error)}
        onRetry={() => window.location.reload()}
      />
    </div>
  )
}
