// Dialog for recording a full or partial direct or group settlement, with live remaining-balance preview (D225).

import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { DEFAULT_USER_CURRENCY, SPLITS } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { LabeledField } from "@/shared/components/labeled-field"
import { todayIso } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

import type { GroupMember, SplitContact } from "../../api"
import { useRecordSettlement } from "../../queries"
import { formatMinorToMajor, parseMajorToMinor } from "../../split-preview"

const SELF_KEY = "self"

/** Pre-filled settlement values from a simplified transfer or People obligation row. */
export interface SettlePreset {
  groupId: number | null
  groupName?: string | null
  groupMembers?: readonly GroupMember[]
  fromKey: string
  toKey: string
  currency: string
  amountMajor: string
  outstandingMinor?: number
}

/** Props for the Settle Up dialog. */
export interface SettleUpDialogProps {
  open: boolean
  contacts: readonly SplitContact[]
  defaultCurrency?: string
  preset: SettlePreset | null
  onOpenChange: (open: boolean) => void
}

/** Records a full or partial repayment in either direct 1-on-1 or group context. */
export function SettleUpDialog({ open, contacts, defaultCurrency, preset, onOpenChange }: SettleUpDialogProps) {
  const t = useTranslations("splits")
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const record = useRecordSettlement()

  const activeContacts = contacts.filter((c) => !c.archived_at)
  const isGroup = preset?.groupId !== null && preset?.groupId !== undefined
  const activeMembers = (preset?.groupMembers ?? []).filter((m) => m.is_active)

  const [fromKey, setFromKey] = useState(preset?.fromKey ?? SELF_KEY)
  const [toKey, setToKey] = useState(preset?.toKey ?? (activeContacts[0] ? `c:${activeContacts[0].id}` : SELF_KEY))
  const [currency, setCurrency] = useState(preset?.currency ?? defaultCurrency ?? DEFAULT_USER_CURRENCY)
  const [amount, setAmount] = useState(preset?.amountMajor ?? "")
  const [settledOn, setSettledOn] = useState(todayIso)
  const [note, setNote] = useState("")

  const options = isGroup
    ? activeMembers.map((m) => ({
        key: `m:${m.id}`,
        label: m.is_self ? `${m.display_name} (${t("groups.youTag")})` : m.display_name,
      }))
    : [
        { key: SELF_KEY, label: t("groups.youTag") },
        ...activeContacts.map((c) => ({ key: `c:${c.id}`, label: c.name })),
      ]

  const typedMinor = parseMajorToMinor(amount, currency)
  const remainingMinor =
    preset?.outstandingMinor !== undefined && typedMinor !== null ? preset.outstandingMinor - typedMinor : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (typedMinor === null || typedMinor <= 0) {
      toast.error(t("dialogs.split.invalidAmount", { currency }))
      return
    }
    try {
      if (isGroup && preset?.groupId) {
        const fromId = Number(fromKey.replace("m:", ""))
        const toId = Number(toKey.replace("m:", ""))
        await record.mutateAsync({
          amount,
          currency,
          settled_on: settledOn,
          note: note.trim() || null,
          group_id: preset.groupId,
          from_member_id: fromId,
          to_member_id: toId,
        })
      } else {
        await record.mutateAsync({
          amount,
          currency,
          settled_on: settledOn,
          note: note.trim() || null,
          group_id: null,
          from_contact_id: fromKey === SELF_KEY ? null : Number(fromKey.replace("c:", "")),
          to_contact_id: toKey === SELF_KEY ? null : Number(toKey.replace("c:", "")),
        })
      }
      toast.success(t("dialogs.settle.saved"))
      onOpenChange(false)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.settle.title")}</DialogTitle>
          <DialogDescription>
            {preset?.groupName
              ? `${preset.groupName} · ${t("dialogs.settle.description")}`
              : t("dialogs.settle.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledField id="settle-from" label={t("dialogs.settle.fromLabel")}>
              <Select value={fromKey} onValueChange={setFromKey}>
                <SelectTrigger id="settle-from" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>

            <LabeledField id="settle-to" label={t("dialogs.settle.toLabel")}>
              <Select value={toKey} onValueChange={setToKey}>
                <SelectTrigger id="settle-to" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {options.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledField id="settle-amount" label={t("dialogs.settle.amountLabel")}>
              <Input
                id="settle-amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </LabeledField>
            <LabeledField id="settle-currency" label={t("dialogs.settle.currencyLabel")}>
              <CurrencySelect id="settle-currency" value={currency} onChange={setCurrency} />
            </LabeledField>
          </div>

          {remainingMinor !== null && remainingMinor >= 0 && (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              {remainingMinor === 0
                ? t("dialogs.settle.fullySettledPreview")
                : t("dialogs.settle.remainingPreview", {
                    amount: formatMoney(formatMinorToMajor(remainingMinor, currency), currency),
                  })}
            </p>
          )}

          <LabeledField id="settle-date" label={t("dialogs.settle.dateLabel")}>
            <Input
              id="settle-date"
              type="date"
              required
              value={settledOn}
              onChange={(e) => setSettledOn(e.target.value)}
            />
          </LabeledField>

          <LabeledField id="settle-note" label={t("dialogs.settle.noteLabel")}>
            <Input
              id="settle-note"
              maxLength={SPLITS.limits.settlementNoteLength}
              placeholder={t("dialogs.settle.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </LabeledField>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("dialogs.cancel")}
            </Button>
            <Button type="submit" disabled={record.isPending || fromKey === toKey}>
              {record.isPending ? t("dialogs.saving") : t("dialogs.settle.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
