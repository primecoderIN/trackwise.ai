// The splits feature's public API: other features and app/ import ONLY from "@/features/splits".

import { lazyWithRetry } from "@/shared/lib/lazy-with-retry"

export type { SplitsOverview } from "./api"
export { splitKeys } from "./queries"

/** Lazy-loaded Splits workspace page (/splits). */
export const SplitsPage = lazyWithRetry(async () => {
  const { SplitsPage: page } = await import("./components/splits-page")
  return { default: page }
})

/** Lazy-loaded Shared group invite acceptance page (/splits/join/[token]). */
export const SplitJoinPage = lazyWithRetry(async () => {
  const { SplitJoinPage: page } = await import("./components/join/split-join-page")
  return { default: page }
})
