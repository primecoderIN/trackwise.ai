// Scene-specific cards and right-hand stage panels for the Hero Walkthrough Player (Phase 29, updated for Splits D226).
// Keeps every walkthrough component concise while giving Splits its own truthful group-balance & privacy choreography.

import { Bot, CheckCircle2, Link2, QrCode, ScanLine, ShieldAlert, ShieldCheck, Users } from "lucide-react"

import type { AssistantWalkthroughSceneTexts, SplitsWalkthroughSceneTexts, WalkthroughSceneTexts } from "../texts"

export type WalkthroughPhase = 0 | 1 | 2

const SPLIT_SEGMENT_COLORS = ["bg-primary", "bg-emerald-500", "bg-sky-500"] as const

function SplitShareBreakdown({
  shareLabels,
  phase,
}: {
  shareLabels: readonly [string, string, string]
  phase: WalkthroughPhase
}) {
  const barWidth = phase === 0 ? "55%" : "100%"
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 w-full gap-1 overflow-hidden rounded-full bg-muted p-0.5">
        {shareLabels.map((label, idx) => (
          <div key={label} className="h-full flex-1 overflow-hidden rounded-full bg-muted-foreground/15">
            <div
              className={`h-full rounded-full transition-all duration-700 ${SPLIT_SEGMENT_COLORS[idx]}`}
              style={{ width: barWidth }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-muted-foreground tabular-nums">
        {shareLabels.map((label, idx) => (
          <span key={label} className={`truncate ${idx === 0 ? "text-primary" : ""}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Main interactive action card shown below the KPI inside the walkthrough workspace canvas. */
export function SceneCardBody({ scene, phase }: { scene: WalkthroughSceneTexts; phase: WalkthroughPhase }) {
  const confirmed = phase === 2
  const scanning = scene.id === "receipts" && phase === 1
  const fillPercent = scene.id === "reports" ? (phase === 0 ? 28 : 64) : 35

  return (
    <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-xl border bg-background p-3.5 shadow-xs">
      {scanning ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-0.5 bg-primary shadow-[0_0_12px_2px_oklch(0.47_0.19_262_/_0.65)] transition-transform duration-700"
        />
      ) : null}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            {scene.id === "receipts" ? <ScanLine className="size-3.5 text-primary" aria-hidden="true" /> : null}
            {scene.id === "splits" ? <Users className="size-3.5 text-primary" aria-hidden="true" /> : null}
            {scene.id === "assistant" ? (
              <ShieldAlert className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            ) : null}
            <span>{scene.primaryTitle}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{scene.primaryMeta}</p>
        </div>
        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums">
          {scene.secondaryValue}
        </span>
      </div>

      {scene.id === "splits" ? <SplitShareBreakdown shareLabels={scene.splitsPanel.shareLabels} phase={phase} /> : null}

      {scene.id === "reports" ? (
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${fillPercent}%` }}
          />
          <span className="absolute top-0 left-[70%] h-full w-0.5 bg-foreground/60" aria-hidden="true" />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] text-muted-foreground">{scene.secondaryLabel}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-300 ${
            confirmed
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : phase === 1
                ? "scale-95 bg-primary text-primary-foreground shadow-sm"
                : "bg-primary/90 text-primary-foreground"
          }`}
        >
          {confirmed ? <CheckCircle2 className="size-3" aria-hidden="true" /> : null}
          <span>{confirmed ? scene.doneStatus : scene.actionButtonLabel}</span>
        </span>
      </div>
    </div>
  )
}

/** Right-hand chat panel for assistant-driven scenes (expenses, receipts, delete confirmation, reports). */
export function AssistantStagePanel({
  assistantTitle,
  scene,
  localProgress,
}: {
  assistantTitle: string
  scene: AssistantWalkthroughSceneTexts
  localProgress: number
}) {
  const typedChars = Math.max(4, Math.round(scene.assistantPrompt.length * Math.min(1, localProgress * 2.1)))
  const showChip = localProgress >= 0.34
  const showReply = localProgress >= 0.56

  return (
    <div className="flex flex-col justify-between gap-2.5 border-t bg-muted/15 p-4 sm:p-5 lg:col-span-4 lg:border-t-0 lg:border-l">
      <div className="flex items-center gap-1.5 border-b pb-2 text-xs font-semibold">
        <Bot className="size-3.5 text-primary" aria-hidden="true" />
        <span>{assistantTitle}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        <div className="self-end rounded-xl bg-primary px-3 py-2 text-xs text-primary-foreground shadow-xs">
          <span>{scene.assistantPrompt.slice(0, typedChars)}</span>
          {localProgress < 0.45 ? (
            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-primary-foreground" />
          ) : null}
        </div>
        {showChip ? (
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition-opacity duration-300 dark:text-emerald-400">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            <span>{scene.assistantChip}</span>
          </div>
        ) : null}
        {showReply ? (
          <div className="rounded-xl border bg-background p-3 text-xs leading-relaxed text-muted-foreground transition-opacity duration-300">
            {scene.assistantReply}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** Right-hand shared group balance, private-share logging, and opt-in UPI QR panel for the Splits scene. */
export function SplitsStagePanel({
  scene,
  phase,
  localProgress,
}: {
  scene: SplitsWalkthroughSceneTexts
  phase: WalkthroughPhase
  localProgress: number
}) {
  const { splitsPanel } = scene
  const showPrivateChip = localProgress >= 0.34
  const showFooter = localProgress >= 0.56
  const settledStyle = phase === 2 ? "border-emerald-500/35 bg-emerald-500/5" : "bg-background"

  return (
    <div className="flex flex-col justify-between gap-2.5 border-t bg-muted/15 p-4 sm:p-5 lg:col-span-4 lg:border-t-0 lg:border-l">
      <div className="flex items-center justify-between gap-2 border-b pb-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-3.5 text-primary" aria-hidden="true" />
          <span>{splitsPanel.panelTitle}</span>
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {splitsPanel.groupBadge}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        <div className={`rounded-xl border p-2.5 transition-colors duration-300 ${settledStyle}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <Link2 className="size-3 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{splitsPanel.inviteLine}</span>
          </div>
          <ul className="mt-1.5 space-y-1 text-xs font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
            {splitsPanel.transferLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        {showPrivateChip ? (
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition-opacity duration-300 dark:text-emerald-400">
            <ShieldCheck className="size-3 shrink-0" aria-hidden="true" />
            <span>{splitsPanel.privateChip}</span>
          </div>
        ) : null}
        {showFooter ? (
          <div className="flex items-start gap-2 rounded-xl border bg-background p-2.5 text-[11px] leading-relaxed text-muted-foreground transition-opacity duration-300">
            <QrCode className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>{splitsPanel.footerNote}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
