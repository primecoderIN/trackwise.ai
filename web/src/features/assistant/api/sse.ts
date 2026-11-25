// Server-Sent Events framing for the assistant's stream: split the text into events, take each event's `data:`
// lines, and read a stream as those data strings as they arrive. Knows nothing about AG-UI; agent-stream.ts
// parses what comes out. Also defines `StreamError` so stream breaks translate in the active UI language.

import { isAbort, UserFacingError } from "@/shared/lib/errors"

import assistantEn from "../i18n/en"

/** Key under the `assistant.stream` message group. */
export type AssistantStreamErrorKey = keyof typeof assistantEn.stream

/** Client-side SSE framing or parsing failure whose message is localized from `assistant.stream`. */
export class StreamError extends UserFacingError {
  readonly streamKey: AssistantStreamErrorKey

  constructor(streamKey: AssistantStreamErrorKey) {
    super(assistantEn.stream[streamKey])
    this.streamKey = streamKey
  }
}

const SSE_EVENT_END = "\n\n"
const SSE_LINE_END = "\n"
const SSE_DATA = "data:"
/** The largest single SSE event buffer we will hold before refusing an unbounded stream (512 KB). */
export const MAX_SSE_EVENT_BYTES = 512 * 1024

// Normalises CRLF and bare CR to LF, leaving a trailing CR at the end of `chunk` untouched in case its LF
// arrives at the start of the next streamed chunk.
function normalizeNewlines(chunk: string, flush = false): string {
  const withoutCrLf = chunk.replace(/\r\n/g, SSE_LINE_END)
  return flush ? withoutCrLf.replace(/\r/g, SSE_LINE_END) : withoutCrLf.replace(/\r(?!$)/g, SSE_LINE_END)
}

/**
 * Splits buffered stream text into complete events (each ends with a blank line) and the unfinished tail. A
 * piece of the stream can end mid-event, so `rest` is kept and the next piece is added to it.
 */
export function splitEvents(buffer: string): { events: string[]; rest: string } {
  const events = normalizeNewlines(buffer).split(SSE_EVENT_END)
  const rest = events.pop() ?? ""
  return { events, rest }
}

/** One SSE event block's `data:` lines, joined. Comments (FastAPI's ": ping" keep-alives) have none: "". */
export function dataOf(block: string): string {
  return normalizeNewlines(block, true)
    .split(SSE_LINE_END)
    .filter((line) => line.startsWith(SSE_DATA))
    .map((line) => line.slice(SSE_DATA.length).replace(/^ /, ""))
    .join(SSE_LINE_END)
}

// One read. Stopped on purpose (Stop, or the page closed) stays an AbortError; a network drop mid-reply
// becomes a StreamError("connectionLost").
async function read(reader: ReadableStreamDefaultReader<string>): Promise<ReadableStreamReadResult<string>> {
  try {
    return await reader.read()
  } catch (error) {
    if (isAbort(error)) throw error
    throw new StreamError("connectionLost")
  }
}

/**
 * Reads `stream` piece by piece as it arrives and yields each event's data, skipping events without any. Ends
 * when the stream does. Throws an AbortError if the request was stopped, or a StreamError("connectionLost") if
 * the network dropped. However it ends (including the caller breaking out early), the reader is cancelled, which
 * closes the connection.
 */
export async function* sseData(stream: ReadableStream<string>): AsyncGenerator<string, void, undefined> {
  const reader = stream.getReader()
  let buffer = ""
  try {
    for (;;) {
      const { value, done } = await read(reader)
      if (done) {
        const tail = normalizeNewlines(buffer, true).trim()
        if (tail) {
          for (const block of tail.split(SSE_EVENT_END)) {
            const data = dataOf(block)
            if (data) yield data
          }
        }
        return
      }
      const { events, rest } = splitEvents(buffer + value)
      if (rest.length > MAX_SSE_EVENT_BYTES) {
        throw new StreamError("connectionLost")
      }
      buffer = rest
      for (const block of events) {
        const data = dataOf(block)
        if (data) yield data
      }
    }
  } finally {
    // Nothing to do if the stream already ended; a failed cancel has nothing left to clean up.
    reader.cancel().catch(() => {})
  }
}
