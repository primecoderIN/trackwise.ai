"use client"

// Syncs the UI language once per signed-in user from their persisted account preference (`preferred_language`).
// Part of app/_frame/. Used by AppLayout so returning users signing in on a new device get their saved language
// without overriding manual switches during the session or interrupting first-run onboarding.

import { useEffect, useRef } from "react"

import { useSignedInUser } from "@/features/auth"
import { isLanguage, useLanguage } from "@/shared/i18n"

/** Applies `user.preferred_language` once after sign-in for users who have completed onboarding. */
export function useSyncUserLanguage(): void {
  const user = useSignedInUser().data
  const { language, setLanguage } = useLanguage()
  const syncedUserId = useRef<number | null>(null)

  useEffect(() => {
    if (!user || syncedUserId.current === user.id) return
    syncedUserId.current = user.id
    if (user.welcomed_at == null) return
    if (isLanguage(user.preferred_language) && user.preferred_language !== language) {
      void setLanguage(user.preferred_language).catch(() => undefined)
    }
  }, [user, language, setLanguage])
}
