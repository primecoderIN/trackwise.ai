// Zero-dependency safe Markdown renderer for assistant replies: parses paragraphs, bullet/numbered lists, **bold**,
// *italic*, and `inline code` purely into escaped React elements — never innerHTML and never raw external links.

import { Fragment, type ReactNode } from "react"

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g
const BULLET_LINE = /^[-*•]\s+(.*)$/
const ORDERED_LINE = /^\d+\.\s+(.*)$/

function renderInline(line: string, keyPrefix: string): ReactNode[] {
  const parts = line.split(INLINE_PATTERN)
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    return <Fragment key={key}>{part}</Fragment>
  })
}

type Block = { kind: "paragraph"; lines: string[] } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] }

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  const lines = text.replace(/\r\n/g, "\n").split("\n")

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }
    const bullet = BULLET_LINE.exec(trimmed)
    if (bullet) {
      const prev = blocks.at(-1)
      if (prev?.kind === "ul") prev.items.push(bullet[1])
      else blocks.push({ kind: "ul", items: [bullet[1]] })
      continue
    }
    const ordered = ORDERED_LINE.exec(trimmed)
    if (ordered) {
      const prev = blocks.at(-1)
      if (prev?.kind === "ol") prev.items.push(ordered[1])
      else blocks.push({ kind: "ol", items: [ordered[1]] })
      continue
    }
    const prev = blocks.at(-1)
    if (prev?.kind === "paragraph") prev.lines.push(line)
    else blocks.push({ kind: "paragraph", lines: [line] })
  }
  return blocks
}

/** Safe React Markdown formatter for streamed assistant prose (no raw HTML, no untrusted links). */
export function MarkdownText({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  if (blocks.length === 0) return null

  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed wrap-break-word">
      {blocks.map((block, bIndex) => {
        if (block.kind === "ul") {
          return (
            <ul key={bIndex} className="list-disc space-y-1 pl-4">
              {block.items.map((item, iIndex) => (
                <li key={iIndex}>{renderInline(item, `ul-${bIndex}-${iIndex}`)}</li>
              ))}
            </ul>
          )
        }
        if (block.kind === "ol") {
          return (
            <ol key={bIndex} className="list-decimal space-y-1 pl-4">
              {block.items.map((item, iIndex) => (
                <li key={iIndex}>{renderInline(item, `ol-${bIndex}-${iIndex}`)}</li>
              ))}
            </ol>
          )
        }
        return (
          <p key={bIndex} className="whitespace-pre-wrap">
            {block.lines.map((line, lIndex) => (
              <Fragment key={lIndex}>
                {lIndex > 0 && "\n"}
                {renderInline(line, `p-${bIndex}-${lIndex}`)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
