"use client"

// Interactive product walkthrough player showing trackwise.ai across 5 core scenes (Expenses, Receipts, Splits,
// Assistant safety, and Reports). Uses crisp state-highlighted chapters and a custom progress bar without drifting
// fake mouse coordinates.

import { Button } from "@primecoderin/fast-ui-react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"

import type { WalkthroughTexts } from "../texts"
import { type WalkthroughPhase, WalkthroughStageCanvas } from "./walkthrough-scenes"

const SCENE_MS = 5000
const TICK_MS = 50

function formatSeconds(ms: number): string {
  const sec = Math.floor(ms / 1000)
  return `0:${String(sec).padStart(2, "0")}`
}

/** Interactive animated product walkthrough player with chapter progress bars and Play / Pause / Restart controls. */
export function WalkthroughPlayer({ walkthrough }: { walkthrough: WalkthroughTexts }) {
  const sceneCount = walkthrough.scenes.length
  const totalMs = SCENE_MS * sceneCount
  const [elapsedMs, setElapsedMs] = useState(0)
  const [playing, setPlaying] = useState(() =>
    typeof window !== "undefined" ? !window.matchMedia("(prefers-reduced-motion: reduce)").matches : true,
  )

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setElapsedMs((prev) => (prev + TICK_MS) % totalMs)
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [playing, totalMs])

  const sceneIndex = Math.min(sceneCount - 1, Math.floor(elapsedMs / SCENE_MS))
  const localProgress = (elapsedMs % SCENE_MS) / SCENE_MS
  const phase: WalkthroughPhase = localProgress < 0.3 ? 0 : localProgress < 0.62 ? 1 : 2
  const scene = walkthrough.scenes[sceneIndex] ?? walkthrough.scenes[0]
  const overallPercent = Math.round((elapsedMs / totalMs) * 100)

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card text-left shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 bg-muted/40 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-rose-400/75" />
            <span className="size-2.5 rounded-full bg-amber-400/75" />
            <span className="size-2.5 rounded-full bg-emerald-400/75" />
          </div>
          <span className="ml-1 truncate text-[11px] font-medium text-muted-foreground">{walkthrough.windowTitle}</span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <span className={`size-1.5 rounded-full bg-primary ${playing ? "animate-pulse" : ""}`} aria-hidden="true" />
          <span>{walkthrough.liveBadge}</span>
        </span>
      </div>

      <WalkthroughStageCanvas walkthrough={walkthrough} scene={scene} phase={phase} localProgress={localProgress} />

      <div className="border-t border-border/80 bg-muted/25 px-3 py-3 sm:px-4 sm:py-3.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{scene.actionCaption}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              variant="secondary"
              size="small"
              icon={playing ? <Pause /> : <Play />}
              aria-label={playing ? walkthrough.pauseLabel : walkthrough.playLabel}
              onClick={() => setPlaying((state) => !state)}
            />
            <Button
              variant="icon"
              size="small"
              icon={<RotateCcw />}
              aria-label={walkthrough.restartLabel}
              onClick={() => {
                setElapsedMs(0)
                setPlaying(true)
              }}
            />
            <span className="ms-1 font-mono text-[11px] text-muted-foreground tabular-nums">
              {formatSeconds(elapsedMs)} / {formatSeconds(totalMs)}
            </span>
          </div>
        </div>

        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <progress className="sr-only" value={overallPercent} max={100} aria-label={walkthrough.seekLabel} />
          <div
            aria-hidden="true"
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
          {walkthrough.scenes.map((item, idx) => {
            const active = idx === sceneIndex
            const fillPct = idx < sceneIndex ? 100 : active ? Math.round(localProgress * 100) : 0
            const mobileSpan = idx === sceneCount - 1 && sceneCount % 2 === 1 ? "col-span-2 sm:col-span-1" : ""
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setElapsedMs(idx * SCENE_MS + 100)
                  setPlaying(true)
                }}
                className={`overflow-hidden rounded-xl border px-2.5 py-2 text-left text-[11px] transition-colors ${mobileSpan} ${
                  active
                    ? "border-primary/45 bg-card font-semibold text-primary shadow-2xs"
                    : "border-transparent bg-background/60 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span className="block truncate">
                  {String(idx + 1).padStart(2, "0")} · {item.chapterLabel}
                </span>
                <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full bg-primary transition-all duration-100"
                    style={{ width: `${fillPct}%` }}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
