// Preview cards for the bottom 3 sections of `/features` (Budgets, Reports, and Workspace Controls).
// Part of app/_public/components/ (Phase 29), keeping each component file concise.

import { AlertTriangle, Command, Download, Globe } from "lucide-react"

import type { FeaturesPageTexts } from "../texts"

type PreviewData = FeaturesPageTexts["previewData"]

/** Mockup showing a Budget Pace Meter near 85%, elapsed-month marker, and budget alert. */
export function BudgetsFeaturePreview({ data }: { data: PreviewData }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-md ring-1 ring-border/50">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{data.budgetOverallLabel}</span>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          {data.budgetPaceNote}
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full bg-muted">
        <div className="h-full w-[85%] rounded-full bg-amber-500" />
        <span className="absolute -top-0.5 left-[68%] h-3.5 w-0.5 rounded bg-foreground/65" aria-hidden="true" />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{data.budgetOverallValue}</span>
        <span>85%</span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
        <span>{data.budgetAlertNote}</span>
      </div>
    </div>
  )
}

/** Mockup showing the Monthly Report summary with month-over-month delta and CSV / MD downloads. */
export function ReportsFeaturePreview({ data }: { data: PreviewData }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-md ring-1 ring-border/50">
      <div className="flex items-center justify-between border-b pb-2.5">
        <span className="text-sm font-semibold">{data.reportMonth}</span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
          {data.reportDelta}
        </span>
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">{data.reportDailyAvg}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium">
          <Download className="size-3.5 text-primary" aria-hidden="true" />
          <span>{data.reportCsvLabel}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-3 py-1.5 text-xs font-medium">
          <Download className="size-3.5 text-primary" aria-hidden="true" />
          <span>{data.reportMdLabel}</span>
        </span>
      </div>
    </div>
  )
}

/** Mockup showing keyboard Command Search (Ctrl+K), bilingual support, and session preferences. */
export function WorkspaceFeaturePreview({ data }: { data: PreviewData }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-md ring-1 ring-border/50">
      <div className="flex items-center justify-between border-b pb-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Globe className="size-3.5 text-primary" aria-hidden="true" />
          <span>{data.workspaceHeader}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded border bg-muted/60 px-2 py-0.5 text-[11px] font-medium">
          <Command className="size-3" aria-hidden="true" />
          <span>{data.workspaceShortcutLabel}</span>
        </span>
      </div>
      <div className="rounded-md border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
        {data.workspaceSessionNote}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.workspaceItems.map((item) => (
          <span key={item} className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
