// A component of the assistant feature: one tool call rendered as a semantic status pill (running, done, failed, or
// unknown). Used by ChatMessageBubble.

import { StatusBadge } from "@primecoderin/fast-ui-react"
import { Check, CircleHelp, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { TOOL_STATUSES, type ToolActivity } from "../model/chat-types"

/**
 * One tool call as a compact status chip with semantic colouring: info while running, success when done, error when
 * failed, or warning "?" when interrupted.
 */
export function ToolChip({ tool }: { tool: ToolActivity }) {
  const t = useTranslations("assistant")
  const { running, done, failed } = tool.labels
  const detail = tool.detail ? <span className="font-mono opacity-75">{tool.detail}</span> : null

  if (tool.status === TOOL_STATUSES.running) {
    return (
      <StatusBadge tone="info" className="gap-1.5">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" /> {running}
      </StatusBadge>
    )
  }
  if (tool.status === TOOL_STATUSES.unknown) {
    const notConfirmed = t("chips.notConfirmed")
    return (
      <StatusBadge tone="warning" className="gap-1">
        <span title={notConfirmed} className="inline-flex items-center gap-1">
          <CircleHelp className="size-3" aria-hidden="true" /> {done}?<span className="sr-only"> {notConfirmed}</span>
        </span>
      </StatusBadge>
    )
  }
  if (tool.status === TOOL_STATUSES.failed) {
    return (
      <StatusBadge tone="error" className="gap-1">
        <X className="size-3" aria-hidden="true" /> {failed} {detail}
      </StatusBadge>
    )
  }
  return (
    <StatusBadge tone="success" className="gap-1">
      <Check className="size-3" aria-hidden="true" /> {done} {detail}
    </StatusBadge>
  )
}
