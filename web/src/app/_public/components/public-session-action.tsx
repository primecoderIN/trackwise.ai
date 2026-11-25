"use client"

// Client CTA button for server-rendered public pages (Phase 29): probes `/api/v1/auth/user` (sending X-CSRF: 1)
// so a signed-in visitor sees "Open Dashboard" instead of "Sign in" / "Get started". Part of app/_public/components/.

import Link from "next/link"
import { useLocale } from "next-intl"
import { useEffect, useState } from "react"

import { apiHeaders } from "@/shared/api/http"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { DEFAULT_LANGUAGE, isLanguage } from "@/shared/i18n/languages"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

interface PublicSessionActionProps {
  signedOutLabel: string
  signedInLabel: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

/** Link button to `/sign-in` (in active locale), upgrading automatically to `/dashboard` when signed in. */
export function PublicSessionAction({
  signedOutLabel,
  signedInLabel,
  variant = "default",
  size = "default",
  className,
}: PublicSessionActionProps) {
  const [signedIn, setSignedIn] = useState(false)
  const rawLocale = useLocale()
  const lang = isLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/v1/auth/user", {
      headers: apiHeaders(),
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => {
        if (response.ok) setSignedIn(true)
      })
      .catch(() => {
        // Keep default signed-out CTA when unreachable or unauthenticated.
      })
    return () => controller.abort()
  }, [])

  return (
    <Button asChild variant={variant} size={size} className={cn(className)}>
      <Link href={signedIn ? ROUTES.dashboard : localizedPath(ROUTES.signIn, lang)}>
        {signedIn ? signedInLabel : signedOutLabel}
      </Link>
    </Button>
  )
}
