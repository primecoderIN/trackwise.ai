// A component of the assistant feature: unified rounded composer with auto-growing textarea, image-thumbnail
// receipt preview, clipboard paste support, and Send/Stop action. Used by ChatPanel.

import { Button } from "@primecoderin/fast-ui-react"
import { toast } from "@/shared/lib/toast"
import { SendHorizontal, Square } from "lucide-react"
import { useTranslations } from "next-intl"
import { memo, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react"

import { LIMITS } from "@/shared/api/contracts.gen"

import { attachmentProblem, MAX_RECEIPT_MB } from "../model/attachments"
import { AttachButton } from "./attach-button"
import { AttachedFile } from "./attached-file"

interface ChatComposerProps {
  /** A run is in progress: typing still works, Enter does nothing, Send becomes Stop. */
  sending: boolean
  /** Optional externally dropped receipt file (from ChatPanel drag-and-drop). */
  droppedFile?: File | null
  /** Clears `droppedFile` once absorbed into the composer's draft state. */
  onConsumeDroppedFile?: () => void
  /** Called with the trimmed text and optional attached receipt when the user sends. */
  onSend: (text: string, file?: File) => void
  /** Called by Stop. */
  onStop: () => void
}

/**
 * Unified rounded message composer: auto-grows as text wraps, supports Ctrl/⌘+V receipt image paste, previews
 * attached receipt photos, and switches cleanly between Send and Stop.
 */
export const ChatComposer = memo(function ChatComposer({
  sending,
  droppedFile,
  onConsumeDroppedFile,
  onSend,
  onStop,
}: ChatComposerProps) {
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const t = useTranslations("assistant")
  const ready = Boolean(input.trim() || file)

  useEffect(() => {
    if (!droppedFile) return
    setFile(droppedFile)
    onConsumeDroppedFile?.()
  }, [droppedFile, onConsumeDroppedFile])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }, [input])

  function submit() {
    if (!ready || sending) return
    onSend(input.trim(), file ?? undefined)
    setInput("")
    setFile(null)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (sending) return
    const pastedFile = Array.from(event.clipboardData.files)[0]
    if (!pastedFile) return
    const problem = attachmentProblem(pastedFile)
    if (problem) {
      toast.error(t(`composer.${problem}`, { name: pastedFile.name, max: MAX_RECEIPT_MB }))
      return
    }
    event.preventDefault()
    setFile(pastedFile)
  }

  return (
    <form onSubmit={handleSubmit} className="shrink-0 border-t border-border/80 bg-background p-3">
      <div className="flex flex-col gap-2 rounded-2xl border border-input bg-card p-2 shadow-2xs transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25">
        {file && (
          <div className="px-1 pt-0.5">
            <AttachedFile name={file.name} file={file} onRemove={() => setFile(null)} />
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <AttachButton disabled={sending} onAttach={setFile} />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={t("composer.placeholder")}
            rows={1}
            maxLength={LIMITS.messageLength}
            aria-label={t("composer.label")}
            className="max-h-36 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm leading-snug text-foreground outline-none placeholder:text-muted-foreground"
          />
          {sending ? (
            <Button
              type="button"

              variant="secondary"
              aria-label={t("composer.stop")}
              title={t("composer.stop")}
              onClick={onStop}
              className="shrink-0 rounded-xl"
              size="small"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              variant="icon"
              type="submit"

              aria-label={t("composer.send")}
              disabled={!ready}
              className="shrink-0 rounded-xl"
              size="small"
            >
              <SendHorizontal className="size-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1.5 hidden px-1 text-[11px] text-muted-foreground/80 sm:block">{t("composer.hint")}</p>
    </form>
  )
})
