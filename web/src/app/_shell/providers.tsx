"use client"

// The providers: app-wide services that any component below them can reach through React context. Part of the
// app composition (app/). It's also where the assistant meets the app's refresh rule: when the assistant reports
// that data changed, refreshAfter (query-client.ts) runs for expenses, so the assistant feature never needs to know
// which pages show expenses. Used once, by client-root.tsx, around the page.

import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

import { ThemeProvider } from "@/shared/theme"
import { Toaster } from "@/shared/ui/sonner"
import { TooltipProvider } from "@/shared/ui/tooltip"

import { queryClient } from "./query-client"

/**
 * Everything the whole app shares: server data (TanStack Query), the theme, tooltips (used by the
 * collapsed sidebar), and toast messages.
 * The Toaster is the one place where toast messages appear, for every page.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {children}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
