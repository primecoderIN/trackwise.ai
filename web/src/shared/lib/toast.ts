// Toasts for code that runs outside React rendering (mutation callbacks, plain helper modules). Part of shared/lib.
// A thin bridge over @primecoderin/fast-ui-react's useAppToast: ToastBridge (shared/components/toast-bridge.tsx)
// binds the hook's object once, inside DesignSystemProvider, and these functions delegate to it. Components that
// render may call useAppToast() directly instead.

import type { useAppToast } from "@primecoderin/fast-ui-react"

type ToastApi = ReturnType<typeof useAppToast>

let bound: ToastApi | null = null

/** Called by ToastBridge with the design system's toaster; passing null unbinds it. */
export function bindToast(api: ToastApi | null): void {
  bound = api
}

/** Shows success, error, warning or info toasts through the design system's app-wide toaster. */
export const toast = {
  success: (message: string): void => bound?.success(message),
  error: (message: string): void => bound?.error(message),
  warning: (message: string): void => bound?.warning(message),
  info: (message: string): void => bound?.info(message),
}
