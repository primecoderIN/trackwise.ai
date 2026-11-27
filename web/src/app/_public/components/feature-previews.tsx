// Preview cards for the top 3 sections of `/features` (AI Assistant, Receipt Scanning, Expenses & Currencies),
// plus the dispatcher across all 6 preview kinds. Part of app/_public/components/.

import { Bot, FileCheck2, Search, ShieldAlert } from "lucide-react"

import type { FeaturesPageTexts, FeatureShowcaseSection } from "../texts"
import {
  BudgetsFeaturePreview,
  ReportsFeaturePreview,
  SplitsFeaturePreview,
  WorkspaceFeaturePreview,
} from "./feature-preview-cards"

type PreviewData = FeaturesPageTexts["previewData"]

function AssistantFeaturePreview({ data }: { data: PreviewData }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-md ring-1 ring-border/50">
      <div className="flex items-center justify-between border-b pb-2.5 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <Bot className="size-3.5 text-primary" aria-hidden="true" />
          <span>{data.assistantHeader}</span>
        </span>
        <span className="self-end rounded-full bg-primary px-2.5 py-0.5 text-[11px] text-primary-foreground">
          {data.assistantUser}
        </span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{data.assistantChip}</p>
      <div className="rounded-xl border border-amber-500/35 bg-muted/30 p-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>{data.assistantApprovalTitle}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">{data.assistantApprovalMeta}</p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-white">
            {data.assistantApprove}
          </span>
          <span className="rounded-md border bg-background px-3 py-1 text-xs font-medium">{data.assistantCancel}</span>
        </div>
      </div>
    </div>
  )
}

function ReceiptsFeaturePreview({ data }: { data: PreviewData }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-md ring-1 ring-border/50">
      <div className="flex items-center justify-between border-b pb-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <FileCheck2 className="size-3.5 text-primary" aria-hidden="true" />
          <span>{data.receiptBadge}</span>
        </span>
      </div>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-lg border bg-muted/25 px-3 py-2 font-medium">{data.receiptMerchant}</div>
        <div className="rounded-lg border bg-muted/25 px-3 py-2 font-medium tabular-nums">{data.receiptAmount}</div>
        <div className="rounded-lg border bg-muted/25 px-3 py-2">{data.receiptCategory}</div>
        <div className="rounded-lg border bg-muted/25 px-3 py-2">{data.receiptPayment}</div>
      </div>
      <div className="flex justify-end">
        <span className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground">
          {data.receiptConfirm}
        </span>
      </div>
    </div>
  )
}

function ExpensesFeaturePreview({ data }: { data: PreviewData }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-md ring-1 ring-border/50">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Search className="size-3.5" aria-hidden="true" />
        <span>{data.expensesSearchPlaceholder}</span>
      </div>
      <div className="flex items-center justify-between rounded-xl border bg-background px-3.5 py-2.5 text-xs">
        <div className="font-semibold">{data.expensesPrimaryTitle}</div>
        <div className="text-right tabular-nums">
          <p className="font-semibold">{data.expensesPrimaryAmount}</p>
          <p className="text-muted-foreground">{data.expensesPrimaryNote}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">{data.expensesSecondaryNote}</p>
    </div>
  )
}

/** Dispatches the product preview card matching `kind` for each showcase row on `/features`. */
export function FeaturePreview({ kind, data }: { kind: FeatureShowcaseSection["previewKind"]; data: PreviewData }) {
  switch (kind) {
    case "assistant":
      return <AssistantFeaturePreview data={data} />
    case "receipts":
      return <ReceiptsFeaturePreview data={data} />
    case "expenses":
      return <ExpensesFeaturePreview data={data} />
    case "splits":
      return <SplitsFeaturePreview data={data} />
    case "budgets":
      return <BudgetsFeaturePreview data={data} />
    case "reports":
      return <ReportsFeaturePreview data={data} />
    case "workspace":
      return <WorkspaceFeaturePreview data={data} />
  }
}
