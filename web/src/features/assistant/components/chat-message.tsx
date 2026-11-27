// A component of the assistant feature: one message in the conversation. User turns appear as crisp right-aligned
// bubbles; assistant turns use full-width editorial layout so A2UI charts, confirmation cards, and Markdown replies
// breathe comfortably inside the side panel. Used by ChatTranscript.

import { useTranslations } from "next-intl"
import { memo } from "react"

import { cn } from "@/shared/lib/utils"

import { A2uiSurfaceView } from "../a2ui/a2ui-surface"
import type { A2uiRenderContext } from "../a2ui/protocol"
import { MESSAGE_ROLES, MESSAGE_STATUSES, type ChatMessage, type MessageStatus } from "../model/chat-types"
import { AttachedFile } from "./attached-file"
import { MarkdownText } from "./markdown-text"
import { ToolChip } from "./tool-chip"

const ENDED_STYLES: Readonly<Record<MessageStatus, string>> = {
  failed: "rounded-xl border border-destructive/35 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive",
  stopped: "rounded-xl border bg-muted/40 px-3.5 py-2 text-sm text-muted-foreground",
}

interface ChatMessageBubbleProps {
  message: ChatMessage
  /** While a run is in progress, forms can't be changed or sent. */
  formsLocked?: boolean
  onFormChange?: A2uiRenderContext["onChange"]
  onFormSubmit?: A2uiRenderContext["onAction"]
}

/**
 * One message turn: user messages sit right-aligned in a primary pill; assistant messages span the panel width
 * with tool chips, full-width A2UI cards/charts, and safe Markdown prose.
 */
export const ChatMessageBubble = memo(function ChatMessageBubble({
  message,
  formsLocked,
  onFormChange,
  onFormSubmit,
}: ChatMessageBubbleProps) {
  const t = useTranslations("assistant")
  const isUser = message.role === MESSAGE_ROLES.user
  const displayText = message.text || (message.status === MESSAGE_STATUSES.failed ? t("stream.connectionLost") : "")

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {message.attachment && <AttachedFile name={message.attachment} />}
        {displayText && (
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-2xs wrap-break-word whitespace-pre-wrap">
            {displayText}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-start gap-2.5">
      {message.tools && message.tools.length > 0 && (
        <div className="flex w-full flex-wrap gap-1.5" aria-live="polite">
          {message.tools.map((tool) => (
            <ToolChip key={tool.id} tool={tool} />
          ))}
        </div>
      )}

      {message.surfaces && message.surfaces.length > 0 && (
        <div className="flex w-full flex-col gap-2.5">
          {message.surfaces.map((surface) => (
            <A2uiSurfaceView
              key={surface.id}
              surface={surface}
              locked={formsLocked}
              onChange={onFormChange}
              onAction={onFormSubmit}
            />
          ))}
        </div>
      )}

      {displayText &&
        (message.status ? (
          <div className={cn("w-full wrap-break-word whitespace-pre-wrap", ENDED_STYLES[message.status])}>
            {displayText}
          </div>
        ) : (
          <div className="w-full text-foreground">
            <MarkdownText text={displayText} />
          </div>
        ))}
    </div>
  )
})
