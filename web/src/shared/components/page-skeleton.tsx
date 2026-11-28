"use client"

// Generic page-level skeleton shown inside AppLayout's Suspense boundary while a lazy page chunk loads.
// Part of shared/components; prevents blank white/dark flashes during first navigation to a route.

import { SkeletonItem } from "@primecoderin/fast-ui-react"

/** Calm loading placeholder matching the standard header + cards rhythm of signed-in pages. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-2">
          <SkeletonItem className="h-7 w-40 max-w-full rounded-lg" />
          <SkeletonItem className="h-4 w-full max-w-72 rounded-md" />
        </div>
        <SkeletonItem className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonItem className="h-32 w-full rounded-xl" />
        <SkeletonItem className="h-32 w-full rounded-xl" />
        <SkeletonItem className="h-32 w-full rounded-xl" />
      </div>
      <SkeletonItem className="h-64 w-full rounded-xl" />
    </div>
  )
}
