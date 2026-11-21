// Maps the backend's icon names ("utensils", "bus", "shopping-bag"...) to Lucide icons for the Categories page.
// Part of the categories feature. An unknown icon name falls back to Tag, so a new backend category always draws cleanly.

import { Bus, Film, HeartPulse, Plane, Receipt, ShoppingBag, Tag, Utensils, type LucideIcon } from "lucide-react"

const ICONS: Readonly<Record<string, LucideIcon>> = {
  utensils: Utensils,
  bus: Bus,
  "shopping-bag": ShoppingBag,
  receipt: Receipt,
  film: Film,
  "heart-pulse": HeartPulse,
  plane: Plane,
  tag: Tag,
}

/** The Lucide icon component for a category's `icon` name, falling back to `Tag`. */
export function categoryIcon(name: string): LucideIcon {
  return Object.hasOwn(ICONS, name) ? ICONS[name] : Tag
}
