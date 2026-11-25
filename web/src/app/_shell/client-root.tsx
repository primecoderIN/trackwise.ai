"use client"

// The browser-side app's root: wraps the tree in the outermost error boundary and shared client providers.
// Part of the app composition (app/). Both `(client)/layout.tsx` and `[lang]/sign-in/page.tsx` render it once
// `NextIntlClientProvider` is already mounted on the server, so SSR renders HTML immediately with no boot gate.

import type { ReactNode } from "react"

import { ErrorBoundary } from "@/shared/components/error-boundary"

import { AppCrashed } from "./app-crashed"
import { Providers } from "./providers"

/**
 * Everything browser-side, around `children` (the page). The outermost safety net (AppCrashed) catches a crash
 * outside the page area and the chat, which have boundaries of their own.
 */
export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary fallback={(error) => <AppCrashed error={error} />}>
      <Providers>{children}</Providers>
    </ErrorBoundary>
  )
}
