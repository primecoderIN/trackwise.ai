"use client"

// Connects the design system's toaster to shared/lib/toast.ts. Part of shared/components. Rendered once, inside
// DesignSystemProvider, by app/_shell/providers.tsx.

import { useAppToast } from "@primecoderin/fast-ui-react"
import { useEffect } from "react"

import { bindToast } from "@/shared/lib/toast"

/** Renders nothing; binds useAppToast's (stable) object so non-component code can raise toasts. */
export function ToastBridge() {
  const api = useAppToast()
  useEffect(() => {
    bindToast(api)
    return () => bindToast(null)
  }, [api])
  return null
}
