"use client"

// The providers: app-wide services that any component below them can reach through React context. Part of the
// app composition (app/). Used once, by client-root.tsx, around the page.

import { DesignSystemProvider, type ToastLabelsInput } from "@primecoderin/fast-ui-react"
import { QueryClientProvider } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useMemo, type ReactNode } from "react"

import { useLanguage } from "@/shared/i18n/use-language"
import { ToastBridge } from "@/shared/components/toast-bridge"
import { ThemeProvider, useTheme } from "@/shared/theme"

import { queryClient } from "./query-client"

function DesignSystemBridge({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const { dir } = useLanguage()
  const t = useTranslations("common")

  const toastLabels = useMemo<ToastLabelsInput>(
    () => ({
      titles: {
        success: t("toast.titles.success"),
        error: t("toast.titles.error"),
        warning: t("toast.titles.warning"),
        info: t("toast.titles.info"),
      },
      dismiss: t("toast.dismiss"),
      region: t("toast.region"),
    }),
    [t],
  )

  return (
    <DesignSystemProvider themeMode={theme} direction={dir} toastLabels={toastLabels}>
      <ToastBridge />
      {children}
    </DesignSystemProvider>
  )
}

/**
 * Everything the whole app shares: server data (TanStack Query), theme state, and @primecoderin/fast-ui-react's
 * DesignSystemProvider (which applies `data-theme` and `dir` on <html>, shared tooltip timing, and the app toaster).
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DesignSystemBridge>{children}</DesignSystemBridge>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
