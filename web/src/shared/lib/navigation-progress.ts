// Lightweight client event helper to start the navbar route-transition loader on programmatic navigations (e.g. router.push).
// Shared across app/ and features/ without pulling in UI components.

/** Window CustomEvent name dispatched when a client-side route navigation begins programmatically. */
export const NAV_START_EVENT = "trackwise:nav-start"

/** Notify mounted NavProgressBar instances that a client-side page navigation has started. */
export function notifyNavigationStart(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NAV_START_EVENT))
  }
}
