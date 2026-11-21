"use client"

// Horizontal animated progress bar attached flush beneath a top navbar whenever a new route is requested.
// Continuously sweeps smoothly from left to right while navigating across Next.js routes.

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { NAV_START_EVENT } from "@/shared/lib/navigation-progress"

const MIN_VISIBLE_MS = 550
const FADE_OUT_MS = 200
const SAFETY_TIMEOUT_MS = 8000

type LoaderStatus = "idle" | "loading" | "finishing"

function isNavigatingAnchor(event: MouseEvent): boolean {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false
  }
  const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null
  if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download")) return false
  const target = anchor.getAttribute("target")
  if (target && target !== "_self") return false

  try {
    const nextUrl = new URL(anchor.href, window.location.href)
    if (nextUrl.origin !== window.location.origin) return false
    return nextUrl.pathname !== window.location.pathname || nextUrl.search !== window.location.search
  } catch {
    return false
  }
}

/** Sleek left-to-right animated horizontal progress loader rendered flush beneath a navbar. */
export function NavProgressBar() {
  const pathname = usePathname()
  const [status, setStatus] = useState<LoaderStatus>("idle")
  const lastPathnameRef = useRef(pathname)
  const startedAtRef = useRef<number>(0)
  const finishTimerRef = useRef<number | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const safetyTimerRef = useRef<number | null>(null)

  const clearTimers = useCallback(() => {
    for (const timer of [finishTimerRef.current, hideTimerRef.current, safetyTimerRef.current]) {
      if (timer !== null) window.clearTimeout(timer)
    }
    finishTimerRef.current = null
    hideTimerRef.current = null
    safetyTimerRef.current = null
  }, [])

  const startLoading = useCallback(() => {
    clearTimers()
    startedAtRef.current = Date.now()
    setStatus("loading")
    safetyTimerRef.current = window.setTimeout(() => setStatus("idle"), SAFETY_TIMEOUT_MS)
  }, [clearTimers])

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isNavigatingAnchor(event)) startLoading()
    }
    document.addEventListener("click", handleClick, true)
    window.addEventListener("popstate", startLoading)
    window.addEventListener(NAV_START_EVENT, startLoading)
    return () => {
      document.removeEventListener("click", handleClick, true)
      window.removeEventListener("popstate", startLoading)
      window.removeEventListener(NAV_START_EVENT, startLoading)
      clearTimers()
    }
  }, [startLoading, clearTimers])

  useEffect(() => {
    if (lastPathnameRef.current === pathname) return
    lastPathnameRef.current = pathname
    clearTimers()
    const remainingMs =
      startedAtRef.current > 0 ? Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAtRef.current)) : 120
    finishTimerRef.current = window.setTimeout(() => {
      setStatus("finishing")
      hideTimerRef.current = window.setTimeout(() => {
        startedAtRef.current = 0
        setStatus("idle")
      }, FADE_OUT_MS)
    }, remainingMs)
  }, [pathname, clearTimers])

  if (status === "idle") return null

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-50 h-[3px] overflow-hidden bg-primary/15 transition-opacity duration-200 ${
        status === "finishing" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="nav-loader-bar absolute inset-y-0 left-0 w-2/5 rounded-r-full bg-gradient-to-r from-primary/65 via-primary to-sky-400 shadow-[0_0_8px_oklch(0.47_0.19_262_/_0.65)]" />
      <div className="nav-loader-bar-trail absolute inset-y-0 left-0 w-1/3 rounded-r-full bg-gradient-to-r from-transparent via-primary to-sky-400" />
    </div>
  )
}
