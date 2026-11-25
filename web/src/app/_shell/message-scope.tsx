// Server component providing route-scoped `next-intl` messages (workspace baseline + route namespaces) so only
// translations needed by the active page are serialized into the client HTML payload.

import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import type { ReactNode } from "react"

import { pickMessages, WORKSPACE_MESSAGE_NAMESPACES, type AppNamespace } from "@/i18n/messages"

/** Wraps `children` with `WORKSPACE_MESSAGE_NAMESPACES` merged with `namespaces` for the active locale. */
export async function MessageScope({
  namespaces,
  children,
}: {
  namespaces: readonly AppNamespace[]
  children: ReactNode
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={pickMessages(messages, [...WORKSPACE_MESSAGE_NAMESPACES, ...namespaces])}
    >
      {children}
    </NextIntlClientProvider>
  )
}
