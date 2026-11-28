// Shared button-like styling for navigation <Link> elements, matching @primecoderin/fast-ui-react's Button variants
// and tokens without wrapping an anchor inside a button. Part of shared/components.

import { cn } from "@/shared/lib/utils"

/** Visual variant matching @primecoderin/fast-ui-react's Button. */
export type LinkButtonVariant = "primary" | "secondary" | "outline" | "subtle" | "destructive"

/** Size matching @primecoderin/fast-ui-react's Button heights and padding. */
export type LinkButtonSize = "small" | "medium" | "large"

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-button font-semibold no-underline transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"

const VARIANTS: Record<LinkButtonVariant, string> = {
  primary: "bg-primary text-on-primary shadow-primary hover:bg-primary-hover active:bg-primary-active",
  secondary: "border border-line bg-surface text-fg hover:border-primary-active hover:bg-surface-hover",
  outline: "border border-primary-active bg-transparent text-primary-text hover:bg-primary-light",
  subtle: "bg-transparent text-fg-secondary hover:bg-subtle hover:text-fg",
  destructive: "bg-destructive text-on-destructive hover:bg-destructive-hover",
}

const SIZES: Record<LinkButtonSize, string> = {
  small: "h-8 px-3 text-xs",
  medium: "h-10 px-4 text-sm",
  large: "h-12 px-5 text-sm",
}

/** Returns Tailwind classes that style a Next.js <Link> or <a> identically to a fast-ui-react Button. */
export function linkButtonClass({
  variant = "primary",
  size = "medium",
  className,
}: {
  variant?: LinkButtonVariant
  size?: LinkButtonSize
  className?: string
} = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className)
}
