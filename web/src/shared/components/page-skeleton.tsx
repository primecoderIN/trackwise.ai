// Generic page-level skeleton shown inside AppLayout's Suspense boundary while a lazy page chunk loads.
// Part of shared/components; prevents blank white/dark flashes during first navigation to a route.

import { Skeleton } from "@/shared/ui/skeleton"

/** Calm loading placeholder matching the standard header + cards rhythm of signed-in pages. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid min-w-0 flex-1 gap-2">
          <Skeleton className="h-7 w-40 max-w-full rounded-lg" />
          <Skeleton className="h-4 w-full max-w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )
}
