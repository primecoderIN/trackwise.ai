// A component of the dashboard feature: the Dashboard's loading state. Used by the Dashboard page until all of its
// data has arrived.

import { Card, CardContent, CardHeader } from "@/shared/ui/card"
import { Skeleton } from "@/shared/ui/skeleton"

/**
 * Placeholder shapes matching the Dashboard layout (three KPI cards, budget pace card, two charts, five recent rows).
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i} className={i === 2 ? "sm:col-span-2 xl:col-span-1" : ""}>
            <CardHeader className="gap-2">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-8 w-36 max-w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-44 max-w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
