// Server component providing route-scoped `next-intl` messages (workspace baseline + route namespaces) so only
// translations needed by the active page are serialized into the client HTML payload.

import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import type { ReactNode } from "react"

import { pickMessages, WORKSPACE_MESSAGE_NAMESPACES, type AppNamespace } from "@/i18n/messages"

/**
 * Wraps `children` with `baseline` (defaulting to `WORKSPACE_MESSAGE_NAMESPACES`) merged with route-specific
 * `namespaces` for the active locale.
 */
export async function MessageScope({
  namespaces,
  baseline = WORKSPACE_MESSAGE_NAMESPACES,
  children,
}: {
  namespaces: readonly AppNamespace[]
  baseline?: readonly AppNamespace[]
  children: ReactNode
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])
  return (
    <NextIntlClientProvider locale={locale} messages={pickMessages(messages, [...baseline, ...namespaces])}>
      {children}
    </NextIntlClientProvider>
  )
}
