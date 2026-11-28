"use client"

// Client CTA button for server-rendered public pages: shares one memoized `/api/v1/auth/user` probe across
// all instances on the page so signed-in visitors see "Open Dashboard" without firing duplicate network requests.

import Link from "next/link"
import { useLocale } from "next-intl"
import { useEffect, useState } from "react"

import { apiHeaders } from "@/shared/api/http"
import { linkButtonClass, type LinkButtonSize, type LinkButtonVariant } from "@/shared/components/link-button"
import { localizedPath, ROUTES } from "@/shared/config/routes"
import { DEFAULT_LANGUAGE, isLanguage } from "@/shared/i18n/languages"

let cachedProbe: Promise<boolean> | null = null

function checkSignedIn(): Promise<boolean> {
  if (!cachedProbe) {
    cachedProbe = fetch("/api/v1/auth/user", {
      headers: apiHeaders(),
      credentials: "same-origin",
    })
      .then((response) => response.ok)
      .catch(() => false)
  }
  return cachedProbe
}

interface PublicSessionActionProps {
  signedOutLabel: string
  signedInLabel: string
  variant?: LinkButtonVariant
  size?: LinkButtonSize
  className?: string
}

/** Link button to `/sign-in` (in active locale), upgrading automatically to `/dashboard` when signed in. */
export function PublicSessionAction({
  signedOutLabel,
  signedInLabel,
  variant = "primary",
  size = "medium",
  className,
}: PublicSessionActionProps) {
  const [signedIn, setSignedIn] = useState(false)
  const rawLocale = useLocale()
  const lang = isLanguage(rawLocale) ? rawLocale : DEFAULT_LANGUAGE

  useEffect(() => {
    let active = true
    void checkSignedIn().then((ok) => {
      if (active && ok) setSignedIn(true)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <Link
      href={signedIn ? ROUTES.dashboard : localizedPath(ROUTES.signIn, lang)}
      className={linkButtonClass({ variant, size, className })}
    >
      {signedIn ? signedInLabel : signedOutLabel}
    </Link>
  )
}
