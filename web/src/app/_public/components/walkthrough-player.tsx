"use client"

// Auto-playing animated interactive walkthrough player showing trackwise.ai across 5 core scenes (Phase 29, D226).
// Renders a gliding cursor, click ripples, typing prompt, receipt scan, bill splitting, and Play/Pause/Scrub controls.

import { MousePointer2, Pause, Play, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/shared/ui/button"

import type { WalkthroughSceneTexts, WalkthroughTexts } from "../texts"
import { type WalkthroughPhase, WalkthroughStageCanvas } from "./walkthrough-scenes"

const SCENE_MS = 5000
const TICK_MS = 50

const SIDEBAR_CURSOR_Y: Record<WalkthroughSceneTexts["id"], number> = {
  expenses: 34,
  receipts: 45,
  splits: 56,
  assistant: 34,
  reports: 67,
}

const CLICK_POSITIONS = [
  { x: 54, y: 78 },
  { x: 56, y: 76 },
] as const

function formatSeconds(ms: number): string {
  const sec = Math.floor(ms / 1000)
  return `0:${String(sec).padStart(2, "0")}`
}

function cursorPositionFor(sceneId: WalkthroughSceneTexts["id"], localProgress: number) {
  if (localProgress < 0.35) return { x: 16, y: SIDEBAR_CURSOR_Y[sceneId] }
  if (localProgress < 0.72) return CLICK_POSITIONS[0]
  return CLICK_POSITIONS[1]
}

/** Interactive animated video player showing chat logging, receipt scanning, bill splitting, and CSV export. */
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
  const cursor = cursorPositionFor(scene.id, localProgress)
  const clicking = localProgress >= 0.56 && localProgress <= 0.72

  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-card text-left shadow-xl ring-1 ring-border/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/45 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-rose-400/75" />
            <span className="size-2.5 rounded-full bg-amber-400/75" />
            <span className="size-2.5 rounded-full bg-emerald-400/75" />
          </div>
          <span className="ml-1 text-[11px] font-medium text-muted-foreground">{walkthrough.windowTitle}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <span className={`size-1.5 rounded-full bg-primary ${playing ? "animate-pulse" : ""}`} aria-hidden="true" />
          <span>{walkthrough.liveBadge}</span>
        </span>
      </div>

      <div className="relative">
        <WalkthroughStageCanvas walkthrough={walkthrough} scene={scene} phase={phase} localProgress={localProgress} />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-20 hidden -translate-x-1 -translate-y-1 transition-all duration-700 ease-out sm:block"
          style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
        >
          {clicking ? (
            <span className="absolute -top-2 -left-2 size-7 animate-ping rounded-full bg-primary/35" />
          ) : null}
          <MousePointer2 className="size-5 fill-slate-950 text-white drop-shadow-md dark:fill-white dark:text-slate-950" />
        </div>
      </div>

      <div className="border-t bg-muted/30 px-4 py-3">
        <p className="mb-2.5 truncate text-xs font-medium text-foreground">{scene.actionCaption}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-7 shrink-0"
            aria-label={playing ? walkthrough.pauseLabel : walkthrough.playLabel}
            onClick={() => setPlaying((state) => !state)}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label={walkthrough.restartLabel}
            onClick={() => {
              setElapsedMs(0)
              setPlaying(true)
            }}
          >
            <RotateCcw className="size-3.5" />
          </Button>
          <input
            type="range"
            min={0}
            max={totalMs - TICK_MS}
            value={elapsedMs}
            aria-label={walkthrough.seekLabel}
            onChange={(event) => {
              setElapsedMs(Number(event.target.value))
              setPlaying(false)
            }}
            className="h-1.5 flex-1 cursor-pointer accent-primary"
          />
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            {formatSeconds(elapsedMs)} / {formatSeconds(totalMs)}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
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
                className={`overflow-hidden rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition-colors ${mobileSpan} ${
                  active
                    ? "border-primary/40 bg-background font-semibold text-primary"
                    : "bg-background/60 text-muted-foreground hover:text-foreground"
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
