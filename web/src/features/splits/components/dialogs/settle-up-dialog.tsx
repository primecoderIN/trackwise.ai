// Dialog for recording a full or partial direct or group settlement, with live remaining-balance preview (D225).

import { Button, Dialog, SelectField, TextField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { type FormEvent, useMemo, useState } from "react"

import { DEFAULT_USER_CURRENCY, SPLITS } from "@/shared/api/contracts.gen"
import { CurrencySelect } from "@/shared/components/currency-select"
import { DatePicker } from "@/shared/components/date-picker"
import { LabeledField } from "@/shared/components/labeled-field"
import { todayIso } from "@/shared/lib/format"
import { toast } from "@/shared/lib/toast"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { GroupMember, SplitContact } from "../../api"
import { useRecordSettlement } from "../../queries"
import { formatMinorToMajor, parseMajorToMinor } from "../../split-preview"

const SELF_KEY = "self"
const FORM_ID = "settle-up-form"

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
  const tCommon = useTranslations("common")
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

  const options = useMemo<SelectOption[]>(
    () =>
      isGroup
        ? activeMembers.map((m) => ({
            value: `m:${m.id}`,
            label: m.is_self ? `${m.display_name} (${t("groups.youTag")})` : m.display_name,
          }))
        : [
            { value: SELF_KEY, label: t("groups.youTag") },
            ...activeContacts.map((c) => ({ value: `c:${c.id}`, label: c.name })),
          ],
    [activeContacts, activeMembers, isGroup, t],
  )

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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="narrow"
      title={t("dialogs.settle.title")}
      description={
        preset?.groupName ? `${preset.groupName} · ${t("dialogs.settle.description")}` : t("dialogs.settle.description")
      }
      closeLabel={tCommon("ui.close")}
      actions={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("dialogs.cancel")}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={FORM_ID}
            disabled={fromKey === toKey}
            isLoading={record.isPending}
          >
            {record.isPending ? t("dialogs.saving") : t("dialogs.settle.submit")}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label={t("dialogs.settle.fromLabel")}
            options={options}
            value={fromKey}
            onValueChange={setFromKey}
            size="small"
          />
          <SelectField
            label={t("dialogs.settle.toLabel")}
            options={options}
            value={toKey}
            onValueChange={setToKey}
            size="small"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField
            label={t("dialogs.settle.amountLabel")}
            type="text"
            inputMode="decimal"
            required
            placeholder="0.00"
            value={amount}
            onValueChange={setAmount}
            size="small"
          />
          <LabeledField id="settle-currency" label={t("dialogs.settle.currencyLabel")}>
            <CurrencySelect id="settle-currency" value={currency} onChange={setCurrency} />
          </LabeledField>
        </div>

        {remainingMinor !== null && remainingMinor >= 0 && (
          <p className="rounded-md bg-subtle px-3 py-2 text-xs text-fg-secondary">
            {remainingMinor === 0
              ? t("dialogs.settle.fullySettledPreview")
              : t("dialogs.settle.remainingPreview", {
                  amount: formatMoney(formatMinorToMajor(remainingMinor, currency), currency),
                })}
          </p>
        )}

        <LabeledField id="settle-date" label={t("dialogs.settle.dateLabel")}>
          <DatePicker
            id="settle-date"
            value={settledOn}
            ariaLabel={t("dialogs.settle.dateLabel")}
            onChange={(value) => value && setSettledOn(value)}
          />
        </LabeledField>

        <TextField
          label={t("dialogs.settle.noteLabel")}
          maxLength={SPLITS.limits.settlementNoteLength}
          placeholder={t("dialogs.settle.notePlaceholder")}
          value={note}
          onValueChange={setNote}
          size="small"
        />
      </form>
    </Dialog>
  )
}
