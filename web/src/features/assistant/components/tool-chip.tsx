// A component of the assistant feature: one tool call rendered as a semantic status pill (running, done, failed, or
// unknown). Used by ChatMessageBubble.

import { Check, CircleHelp, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/shared/ui/badge"

import { TOOL_STATUSES, type ToolActivity } from "../model/chat-types"

/**
 * One tool call as a compact status chip with semantic colouring: neutral spinning while running, positive green
 * when done, destructive when failed, or outline "?" when interrupted.
 */
export function ToolChip({ tool }: { tool: ToolActivity }) {
  const t = useTranslations("assistant")
  const { running, done, failed } = tool.labels
  const detail = tool.detail ? <span className="font-mono opacity-75">{tool.detail}</span> : null

  if (tool.status === TOOL_STATUSES.running) {
    return (
      <Badge variant="info" className="gap-1.5">
        <Loader2 className="animate-spin" /> {running}
      </Badge>
    )
  }
  if (tool.status === TOOL_STATUSES.unknown) {
    const notConfirmed = t("chips.notConfirmed")
    return (
      <Badge variant="warning" title={notConfirmed} className="gap-1">
        <CircleHelp /> {done}?<span className="sr-only"> {notConfirmed}</span>
      </Badge>
    )
  }
  if (tool.status === TOOL_STATUSES.failed) {
    return (
      <Badge variant="destructive" className="gap-1">
        <X /> {failed} {detail}
      </Badge>
    )
  }
  return (
    <Badge variant="positive" className="gap-1">
      <Check /> {done} {detail}
    </Badge>
  )
}
