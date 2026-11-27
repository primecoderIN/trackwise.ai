// Maps the backend's category icon names ("utensils", "bus", "shopping-bag"...) to Lucide icons and harmonious,
// deterministic colour styles used across Dashboard, Expenses, Budgets, Categories, and Reports. Part of categories.

import { Bus, Film, HeartPulse, Plane, Receipt, ShoppingBag, Tag, Utensils, type LucideIcon } from "lucide-react"

/** Visual styling tokens for one category across icon tiles, badges, and charts. */
export interface CategoryVisual {
  icon: LucideIcon
  /** Tailwind background + text classes for a square/rounded icon tile. */
  tileClass: string
  /** Tailwind classes for a subtle category pill badge. */
  badgeClass: string
  /** CSS colour expression for charts and horizontal share bars (uses theme chart tokens). */
  chartColor: string
}

const DEFAULT_VISUAL: CategoryVisual = {
  icon: Tag,
  tileClass: "bg-slate-500/12 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
  badgeClass: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  chartColor: "var(--chart-8)",
}

const VISUALS: Readonly<Record<string, CategoryVisual>> = {
  utensils: {
    icon: Utensils,
    tileClass: "bg-amber-500/12 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
    badgeClass: "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    chartColor: "var(--chart-4)",
  },
  bus: {
    icon: Bus,
    tileClass: "bg-sky-500/12 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
    badgeClass: "border-sky-500/25 bg-sky-500/10 text-sky-800 dark:text-sky-300",
    chartColor: "var(--chart-3)",
  },
  "shopping-bag": {
    icon: ShoppingBag,
    tileClass: "bg-violet-500/12 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
    badgeClass: "border-violet-500/25 bg-violet-500/10 text-violet-800 dark:text-violet-300",
    chartColor: "var(--chart-5)",
  },
  receipt: {
    icon: Receipt,
    tileClass: "bg-indigo-500/12 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
    badgeClass: "border-indigo-500/25 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300",
    chartColor: "var(--chart-1)",
  },
  film: {
    icon: Film,
    tileClass: "bg-rose-500/12 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    badgeClass: "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300",
    chartColor: "var(--chart-6)",
  },
  "heart-pulse": {
    icon: HeartPulse,
    tileClass: "bg-emerald-500/12 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300",
    badgeClass: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
    chartColor: "var(--chart-2)",
  },
  plane: {
    icon: Plane,
    tileClass: "bg-cyan-500/12 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-300",
    badgeClass: "border-cyan-500/25 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300",
    chartColor: "var(--chart-7)",
  },
  tag: DEFAULT_VISUAL,
}

/** The visual style (icon, tile, badge, chart colour) for a category's `icon` key, falling back cleanly. */
export function categoryVisual(name: string | undefined): CategoryVisual {
  if (!name) return DEFAULT_VISUAL
  return Object.hasOwn(VISUALS, name) ? VISUALS[name] : DEFAULT_VISUAL
}

/** The Lucide icon component for a category's `icon` name, falling back to `Tag`. */
export function categoryIcon(name: string): LucideIcon {
  return categoryVisual(name).icon
}
