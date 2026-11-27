// A component of the assistant feature: the conversation's scrolling transcript with smart stick-to-bottom scrolling,
// a floating "Jump to latest" button when scrolled up, and a welcoming starter-prompt grid when empty.

import { BarChart3, ChevronDown, Loader2, PlusCircle, Sparkles, Utensils } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { useSignedInUser } from "@/features/auth"
import { DEFAULT_CURRENCY } from "@/shared/api/contracts.gen"
import { useFormatters } from "@/shared/lib/use-formatters"
import { Button } from "@/shared/ui/button"

import type { A2uiRenderContext } from "../a2ui/protocol"
import type en from "../i18n/en"
import { MESSAGE_ROLES, TOOL_STATUSES, type ChatMessage } from "../model/chat-types"
import { ChatMessageBubble } from "./chat-message"

const SUGGESTIONS: readonly { key: keyof typeof en.suggestions; icon: typeof Utensils }[] = [
  { key: "foodThisMonth", icon: Utensils },
  { key: "addLunch", icon: PlusCircle },
  { key: "biggestExpenses", icon: BarChart3 },
]

const BOTTOM_THRESHOLD_PX = 80

interface ChatTranscriptProps {
  messages: ChatMessage[]
  /** A run is in progress: suggestions are disabled, forms locked, and "Thinking…" may show. */
  sending: boolean
  /** Called with a suggestion's text when it's clicked. */
  onSuggestion: (text: string) => void
  onFormChange: A2uiRenderContext["onChange"]
  onFormSubmit: A2uiRenderContext["onAction"]
}

function isWaiting(last: ChatMessage | undefined): boolean {
  if (last?.role !== MESSAGE_ROLES.assistant) return true
  return !last.text && !last.tools?.some((tool) => tool.status === TOOL_STATUSES.running)
}

function Suggestions({ sending, onSuggestion }: Pick<ChatTranscriptProps, "sending" | "onSuggestion">) {
  const t = useTranslations("assistant")
  const { formatMoney } = useFormatters()
  const userCurrency = useSignedInUser().data?.default_currency ?? DEFAULT_CURRENCY
  const exampleAmount = formatMoney("25", userCurrency)
  const labelFor = (key: keyof typeof en.suggestions) =>
    key === "addLunch" ? t("suggestions.addLunch", { amount: exampleAmount }) : t(`suggestions.${key}`)

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 py-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{t("transcript.emptyTitle")}</h2>
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{t("transcript.hint")}</p>
      </div>
      <div className="flex flex-col gap-2">
        {SUGGESTIONS.map(({ key, icon: Icon }) => {
          const text = labelFor(key)
          return (
            <button
              key={key}
              type="button"
              disabled={sending}
              onClick={() => onSuggestion(text)}
              className="flex items-start gap-2.5 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-left text-xs leading-snug text-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:opacity-50"
            >
              <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The conversation log. Follows new tokens smoothly while near the bottom, stops hijacking scroll when reading
 * earlier turns, and reveals a floating Jump-to-latest pill when scrolled up.
 */
export function ChatTranscript({ messages, sending, onSuggestion, onFormChange, onFormSubmit }: ChatTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const nearBottomRef = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const t = useTranslations("assistant")

  const last = messages.at(-1)

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = distance <= BOTTOM_THRESHOLD_PX
    nearBottomRef.current = nearBottom
    setShowJump(!nearBottom && messages.length > 0)
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
    nearBottomRef.current = true
    setShowJump(false)
  }

  useEffect(() => {
    if (!nearBottomRef.current) return
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, last?.text, last?.tools?.length, last?.surfaces?.length, sending])

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} onScroll={handleScroll} className="h-full overflow-y-auto">
        <div
          role="log"
          aria-live="polite"
          aria-label={t("transcript.label")}
          className="flex min-h-full flex-col gap-4 p-4"
        >
          {messages.length === 0 && <Suggestions sending={sending} onSuggestion={onSuggestion} />}

          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              formsLocked={sending}
              onFormChange={onFormChange}
              onFormSubmit={onFormSubmit}
            />
          ))}

          {sending && isWaiting(last) && (
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" /> {t("transcript.thinking")}
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => scrollToBottom("smooth")}
            className="pointer-events-auto gap-1 rounded-full border shadow-sm"
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
            <span>{t("transcript.jumpToLatest")}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
