// Every page and group of the menu, listed once: its address, its name, its group and its icon. Part of the app
// composition (app/_frame/, Phase 28). app-sidebar.tsx builds the grouped menu from MENU_GROUPS, top-bar title lookup
// and command-palette.tsx read PAGES.

import {
  FileBarChart,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Settings,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/shared/config/routes"

import type { PageName } from "../_i18n"

/** The menu's group keys, matching `groups.<name>` in `app/_i18n/en.ts`. */
export type GroupName = "overview" | "money" | "insights" | "account"

/** One page of the menu: where it lives and how the menu shows it. */
export interface Page {
  /** Its address, from ROUTES (shared/config/routes.ts), the same one its route file serves. */
  path: string
  /** Its name: the menu shows the app text "pages.<name>". */
  name: PageName
  /** The menu's icon (a lucide-react icon component). */
  icon: LucideIcon
  /** Which sidebar group the page belongs to. */
  group: GroupName
}

/** One group in the sidebar menu. */
export interface MenuGroup {
  name: GroupName
  pages: readonly Page[]
}

/** Every page of the signed-in menu, in the order the menu shows them. */
export const PAGES: readonly Page[] = [
  { path: ROUTES.dashboard, name: "dashboard", icon: LayoutDashboard, group: "overview" },
  { path: ROUTES.expenses, name: "expenses", icon: ReceiptText, group: "money" },
  { path: ROUTES.budgets, name: "budgets", icon: PiggyBank, group: "money" },
  { path: ROUTES.splits, name: "splits", icon: Users, group: "money" },
  { path: ROUTES.categories, name: "categories", icon: Tags, group: "money" },
  { path: ROUTES.reports, name: "reports", icon: FileBarChart, group: "insights" },
  { path: ROUTES.settings, name: "settings", icon: Settings, group: "account" },
]

const GROUP_ORDER: readonly GroupName[] = ["overview", "money", "insights", "account"]

/** The sidebar menu's groups, built once from PAGES so every page appears in its group in order. */
export const MENU_GROUPS: readonly MenuGroup[] = GROUP_ORDER.map((group) => ({
  name: group,
  pages: PAGES.filter((page) => page.group === group),
}))

/** Finds the menu page matching `pathname` (exact match or nested sub-path). */
export function currentPageFor(pathname: string): Page | undefined {
  return PAGES.find((page) => pathname === page.path || pathname.startsWith(`${page.path}/`))
}
