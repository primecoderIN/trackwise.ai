// Animated application screens rendered inside the Hero Walkthrough Player (Phase 29).
// Depicts chat logging, receipt scanning confirmation, delete safety prompts, and monthly budget/report exports.

import {
  Bot,
  CheckCircle2,
  FileBarChart,
  LayoutDashboard,
  ReceiptText,
  ScanLine,
  ShieldAlert,
  Wallet,
} from "lucide-react"

import { APP_NAME } from "@/shared/config/app"

import type { WalkthroughSceneTexts, WalkthroughTexts } from "../texts"

export type WalkthroughPhase = 0 | 1 | 2

function SceneCardBody({ scene, phase }: { scene: WalkthroughSceneTexts; phase: WalkthroughPhase }) {
  const confirmed = phase === 2
  const scanning = scene.id === "receipts" && phase === 1
  const fillPercent = scene.id === "reports" ? (phase === 0 ? 28 : 64) : phase === 0 ? 35 : 88

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

/** Desktop workspace canvas + animated Assistant panel driven by the player's current scene & progress. */
export function WalkthroughStageCanvas({
  walkthrough,
  scene,
  phase,
  localProgress,
}: {
  walkthrough: WalkthroughTexts
  scene: WalkthroughSceneTexts
  phase: WalkthroughPhase
  localProgress: number
}) {
  const navItems = [
    { key: "overview", label: walkthrough.sidebarOverview, icon: LayoutDashboard, active: false },
    {
      key: "expenses",
      label: walkthrough.sidebarExpenses,
      icon: Wallet,
      active: scene.id === "expenses" || scene.id === "assistant",
    },
    { key: "receipts", label: walkthrough.sidebarReceipts, icon: ReceiptText, active: scene.id === "receipts" },
    { key: "reports", label: walkthrough.sidebarReports, icon: FileBarChart, active: scene.id === "reports" },
  ] as const

  const typedChars = Math.max(4, Math.round(scene.assistantPrompt.length * Math.min(1, localProgress * 2.1)))
  const showChip = localProgress >= 0.34
  const showReply = localProgress >= 0.56
  const kpiUpdated = (scene.id === "expenses" && phase === 2) || scene.id !== "expenses"

  return (
    <div className="grid min-h-[270px] lg:grid-cols-12">
      <aside className="hidden border-r bg-muted/20 p-3 lg:col-span-3 lg:flex lg:flex-col lg:gap-1">
        <div className="mb-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold">
          <Wallet className="size-3.5 text-primary" aria-hidden="true" />
          <span>{APP_NAME}</span>
        </div>
        {navItems.map(({ key, label, icon: Icon, active }) => (
          <div
            key={key}
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              active ? "bg-primary/12 font-semibold text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </aside>

      <div className="flex flex-col justify-between gap-3 p-4 sm:p-5 lg:col-span-5">
        <div className="rounded-xl border bg-background p-3.5">
          <p className="text-[11px] font-medium text-muted-foreground">{walkthrough.kpiLabel}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums transition-all duration-500">
            {kpiUpdated ? walkthrough.kpiAfter : walkthrough.kpiBefore}
          </p>
        </div>
        <SceneCardBody scene={scene} phase={phase} />
      </div>

      <div className="flex flex-col justify-between gap-2.5 border-t bg-muted/15 p-4 sm:p-5 lg:col-span-4 lg:border-t-0 lg:border-l">
        <div className="flex items-center gap-1.5 border-b pb-2 text-xs font-semibold">
          <Bot className="size-3.5 text-primary" aria-hidden="true" />
          <span>{walkthrough.assistantTitle}</span>
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
    </div>
  )
}
