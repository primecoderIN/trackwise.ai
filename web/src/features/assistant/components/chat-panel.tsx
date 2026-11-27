// A component of the assistant feature: the chat panel with header, transcript, composer, and full-panel
// drag-and-drop receipt upload support. Loaded lazily through lazy-chat-panel.tsx.

import { Sparkles, SquarePen, Upload, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useCallback, useState, type DragEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/shared/ui/button"

import { useAssistant } from "../model/assistant-context"
import { attachmentProblem, MAX_RECEIPT_MB } from "../model/attachments"
import { ChatComposer } from "./chat-composer"
import { ChatTranscript } from "./chat-transcript"

/** The chat panel's props. */
export interface ChatPanelProps {
  /** Called by the panel's close button. Only the panel closes: the conversation stays in AssistantProvider. */
  onClose: () => void
}

/**
 * The assistant's panel, filling its container with drag-and-drop receipt upload overlay, transcript, and composer.
 */
export function ChatPanel({ onClose }: ChatPanelProps) {
  const chat = useAssistant()
  const t = useTranslations("assistant")
  const [dragging, setDragging] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)

  const consumeDropped = useCallback(() => setDroppedFile(null), [])

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (chat.sending || !event.dataTransfer.types.includes("Files")) return
    event.preventDefault()
    if (!dragging) setDragging(true)
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    setDragging(false)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    if (chat.sending) return
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    const problem = attachmentProblem(file)
    if (problem) {
      toast.error(t(`composer.${problem}`, { name: file.name, max: MAX_RECEIPT_MB }))
      return
    }
    setDroppedFile(file)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-full flex-col border-l border-border/80 bg-background"
    >
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border/80 px-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{t("panel.title")}</p>
          <p className="truncate text-[11px] text-muted-foreground">{t("panel.subtitle")}</p>
        </div>
        <div className="ml-auto flex gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("panel.newConversation")}
            title={t("panel.newConversation")}
            onClick={chat.reset}
            disabled={chat.sending || chat.messages.length === 0}
          >
            <SquarePen className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={t("panel.close")} onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <ChatTranscript
        messages={chat.messages}
        sending={chat.sending}
        onSuggestion={chat.send}
        onFormChange={chat.setFormValue}
        onFormSubmit={chat.submitForm}
      />

      <ChatComposer
        sending={chat.sending}
        droppedFile={droppedFile}
        onConsumeDroppedFile={consumeDropped}
        onSend={chat.send}
        onStop={chat.stop}
      />

      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-background/90 text-center backdrop-blur-xs">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <p className="px-4 text-sm font-semibold text-foreground">{t("panel.dropReceipt")}</p>
        </div>
      )}
    </div>
  )
}
