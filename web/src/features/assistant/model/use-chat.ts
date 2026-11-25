// The conversation, as a custom hook: it holds the messages and wires the run (use-agent-run.ts) to the pure
// transcript changes (transcript.ts) and the run's progress (run-progress.ts). Orchestration only: the rules
// live in those files. AssistantProvider calls it once and shares the result through AssistantContext.

import { EventType } from "@ag-ui/core"
import { useTranslations } from "next-intl"
import { useCallback, useMemo, useRef, useState } from "react"

import { ApiError } from "@/shared/api/http"
import { reportUnexpected } from "@/shared/lib/errors"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { A2uiAction } from "../a2ui/protocol"
import { runAgent, type AgentPrompt, type RunAgent } from "../api/agent-stream"
import { MESSAGE_ROLES, type ChatMessage, type ChatState } from "./chat-types"
import { mayHaveChanged, NEW_RUN, trackEvent } from "./run-progress"
import * as transcript from "./transcript"
import { useAgentRun } from "./use-agent-run"

const CLIENT_ERROR_MIN = 400
const CLIENT_ERROR_MAX = 500
const REQUEST_TIMEOUT_STATUS = 408
const TOO_MANY_REQUESTS_STATUS = 429

// True only when the request was definitively rejected before any tool or side-effect could run.
function isPreExecutionClientError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status >= CLIENT_ERROR_MIN &&
    error.status < CLIENT_ERROR_MAX &&
    error.status !== REQUEST_TIMEOUT_STATUS &&
    error.status !== TOO_MANY_REQUESTS_STATUS
  )
}

/**
 * Everything about the conversation. `onDataChanged` is called whenever the assistant may have changed
 * expenses; this feature doesn't know (or care) which pages show them. `runAgentFn` is the transport, `runAgent`
 * unless a test passes its own. The functions returned keep their identity across renders (for memoised
 * bubbles), as long as `onDataChanged` and `runAgentFn` do.
 */
export function useChat(onDataChanged: () => void, runAgentFn: RunAgent = runAgent): ChatState {
  const t = useTranslations("assistant")
  const messageOf = useMessageOf()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const nextId = useRef(0) // a counter for message ids (a ref: changing it shouldn't re-render anything)
  const submitting = useRef<Set<string>>(new Set()) // synchronous guard against double-clicking a form button
  const { sending, run: runAgentOnce, stop, forgetThread } = useAgentRun(runAgentFn)

  // One run of the agent. `shown` is what appears in your bubble, with the attached file's name if there's one.
  // Resolves to whether the run finished, whether the server changed data during it, and any failure error.
  const run = useCallback(
    async (shown: string, prompt: AgentPrompt) => {
      const userId = nextId.current++
      const replyId = nextId.current++ // reserved now; the bubble appears when the first text, chip or card does
      const attachment = "file" in prompt ? prompt.file?.name : undefined
      setMessages((current) =>
        transcript.appendMessage(current, { id: userId, role: MESSAGE_ROLES.user, text: shown, attachment }),
      )
      let progress = NEW_RUN
      let failedWith: unknown
      const ok = await runAgentOnce(prompt, {
        onEvent: (event) => {
          progress = trackEvent(progress, event)
          // A tool changed expenses: let the pages know.
          if (event.type === EventType.STATE_SNAPSHOT) onDataChanged()
          setMessages((current) => transcript.applyAgentEvent(current, replyId, event))
        },
        onFailed: (error) => {
          failedWith = error
          // The bubble shows only a generic text for a bug, so its details go to the console.
          reportUnexpected(error)
          // A tool was running when the run broke off (or Stop was pressed): its chip says "?", and the pages
          // reload to show what happened.
          const unfinished = progress.running
          if (unfinished.size > 0) {
            setMessages((current) => transcript.markToolsUnknown(current, replyId, unfinished))
            onDataChanged()
          }
          // Any text that already arrived stays; the error (or "Stopped.") appears as its own bubble below it.
          const endId = nextId.current++
          setMessages((current) =>
            transcript.appendMessage(
              current,
              transcript.endedEarlyMessage(endId, error, {
                stopped: t("transcript.stopped"),
                connectionLost: t("stream.connectionLost"),
                messageOf,
                streamError: (key) => t(`stream.${key}`),
              }),
            ),
          )
        },
      })
      return { ok, mayHaveChanged: mayHaveChanged(progress), error: failedWith }
    },
    [messageOf, onDataChanged, runAgentOnce, t],
  )

  const send = useCallback(
    async (text: string, file?: File) => {
      await run(text, { text, file })
    },
    [run],
  )

  const setFormValue = useCallback((surfaceId: string, path: string, value: unknown) => {
    setMessages((current) => transcript.setFormValue(current, surfaceId, path, value))
  }, [])

  // Lock the card first (it decides once), then send its action as the next run.
  const submitForm = useCallback(
    async (action: A2uiAction) => {
      if (submitting.current.has(action.surfaceId)) return
      submitting.current.add(action.surfaceId)
      setMessages((current) => transcript.setSubmitted(current, action.surfaceId, true))
      const outcome = await run(
        transcript.sentText(action, (values) => t("transcript.sent", { values })),
        { action },
      )
      // Unlock only on a deterministic pre-execution 4xx client error before anything could have changed.
      // On network drop, 5xx, stream cut-off, or abort, keep the form locked (D137) and refresh data.
      if (!outcome.ok) {
        if (!outcome.mayHaveChanged && isPreExecutionClientError(outcome.error)) {
          submitting.current.delete(action.surfaceId)
          setMessages((current) => transcript.setSubmitted(current, action.surfaceId, false))
        } else if (!outcome.mayHaveChanged) {
          onDataChanged()
        }
      }
    },
    [onDataChanged, run, t],
  )

  const reset = useCallback(() => {
    stop()
    submitting.current.clear()
    setMessages([])
    forgetThread()
  }, [forgetThread, stop])

  return useMemo(
    () => ({ messages, sending, send, stop, setFormValue, submitForm, reset }),
    [messages, sending, send, stop, setFormValue, submitForm, reset],
  )
}
