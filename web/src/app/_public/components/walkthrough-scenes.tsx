// Animated application screens rendered inside the Hero Walkthrough Player (Phase 29, updated for Splits D226).
// Depicts chat logging, receipt scanning, shared bill splitting, delete safety prompts, and budget/report exports.

import { FileBarChart, LayoutDashboard, ReceiptText, Users, Wallet } from "lucide-react"

import { APP_NAME } from "@/shared/config/app"

import type { WalkthroughSceneTexts, WalkthroughTexts } from "../texts"
import { AssistantStagePanel, SceneCardBody, SplitsStagePanel, type WalkthroughPhase } from "./walkthrough-panels"

export type { WalkthroughPhase } from "./walkthrough-panels"

/** Desktop workspace canvas + animated Assistant or Group Balances panel driven by the player's current scene. */
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
    { key: "splits", label: walkthrough.sidebarSplits, icon: Users, active: scene.id === "splits" },
    { key: "reports", label: walkthrough.sidebarReports, icon: FileBarChart, active: scene.id === "reports" },
  ] as const

  const isSplits = scene.id === "splits"
  const kpiUpdated = isSplits ? phase === 2 : (scene.id === "expenses" && phase === 2) || scene.id !== "expenses"
  const kpiLabel = isSplits ? scene.splitsPanel.kpiLabel : walkthrough.kpiLabel
  const kpiValue = isSplits
    ? kpiUpdated
      ? scene.splitsPanel.kpiAfter
      : scene.splitsPanel.kpiBefore
    : kpiUpdated
      ? walkthrough.kpiAfter
      : walkthrough.kpiBefore
  const kpiTone = isSplits && kpiUpdated ? "text-emerald-600 dark:text-emerald-400" : ""

  return (
    <div className="grid min-h-[260px] md:grid-cols-12">
      <aside className="hidden min-w-0 border-r bg-muted/20 p-3 lg:col-span-3 lg:flex lg:flex-col lg:gap-1 xl:hidden 2xl:col-span-3 2xl:flex">
        <div className="mb-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold">
          <Wallet className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">{APP_NAME}</span>
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

      <div className="flex min-w-0 flex-col justify-between gap-3 p-3.5 sm:p-5 md:col-span-7 lg:col-span-5 xl:col-span-7 2xl:col-span-5">
        <div className="min-w-0 rounded-xl border bg-background p-3.5">
          <p className="text-[11px] font-medium text-muted-foreground">{kpiLabel}</p>
          <p
            className={`mt-1 truncate text-xl font-bold tracking-tight tabular-nums transition-all duration-500 sm:text-2xl ${kpiTone}`}
          >
            {kpiValue}
          </p>
        </div>
        <SceneCardBody scene={scene} phase={phase} />
      </div>

      {isSplits ? (
        <SplitsStagePanel scene={scene} phase={phase} localProgress={localProgress} />
      ) : (
        <AssistantStagePanel assistantTitle={walkthrough.assistantTitle} scene={scene} localProgress={localProgress} />
      )}
    </div>
  )
}
