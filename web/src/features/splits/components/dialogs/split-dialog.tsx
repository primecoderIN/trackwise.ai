// Dialog for creating or editing a direct or group split expense (Equal + Exact custom amounts + optional
// "Also record my share as a personal expense" toggle with budget-watch alerts, D225).

import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { CategorySelect } from "@/features/categories"
import { DEFAULT_USER_CURRENCY, PAYMENT_METHOD_LABELS, SPLITS } from "@/shared/api/contracts.gen"
import type { Schemas } from "@/shared/api/http"
import { paymentMethodValues } from "@/shared/api/schema.gen"

type PaymentMethod = Schemas["PaymentMethod"]
import { CurrencySelect } from "@/shared/components/currency-select"
import { LabeledField } from "@/shared/components/labeled-field"
import { useLanguage } from "@/shared/i18n"
import { todayIso } from "@/shared/lib/format"
import { useFormatters } from "@/shared/lib/use-formatters"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

import type { GroupMember, SplitContact, SplitExpense } from "../../api"
import { useCreateSplitExpense, useUpdateSplitExpense } from "../../queries"
import { formatMinorToMajor, parseMajorToMinor, previewEqualShares } from "../../split-preview"
import { type ParticipantOption, SplitParticipantsField } from "./split-participants-field"

const SELF_KEY = "self"

/** Props for the Split create/edit dialog. */
export interface SplitDialogProps {
  open: boolean
  contacts: readonly SplitContact[]
  groupId: number | null
  groupName?: string | null
  groupMembers?: readonly GroupMember[]
  defaultCurrency?: string
  editing: SplitExpense | null
  onOpenChange: (open: boolean) => void
}

/** Modal form to create or edit a direct or group split with Equal or Exact shares and optional personal recording. */
export function SplitDialog({
  open,
  contacts,
  groupId,
  groupName,
  groupMembers,
  defaultCurrency,
  editing,
  onOpenChange,
}: SplitDialogProps) {
  const t = useTranslations("splits")
  const { language } = useLanguage()
  const { formatMoney } = useFormatters()
  const messageOf = useMessageOf()
  const create = useCreateSplitExpense()
  const update = useUpdateSplitExpense()

  const isGroup = (editing ? editing.group_id : groupId) !== null
  const activeMembers = (groupMembers ?? []).filter((m) => m.is_active)
  const activeContacts = contacts.filter((c) => !c.archived_at)
  const selfMember = activeMembers.find((m) => m.is_self)
  const selfKey = isGroup && selfMember ? `m:${selfMember.id}` : SELF_KEY

  const options: ParticipantOption[] = isGroup
    ? activeMembers.map((m) => ({
        key: `m:${m.id}`,
        label: m.is_self ? `${m.display_name} (${t("groups.youTag")})` : m.display_name,
      }))
    : [
        { key: SELF_KEY, label: t("groups.youTag") },
        ...activeContacts.map((c) => ({ key: `c:${c.id}`, label: c.name })),
      ]

  const initialSelected = editing
    ? editing.shares.map((s) => (isGroup ? `m:${s.member_id}` : s.is_self ? SELF_KEY : `c:${s.contact_id}`))
    : options.map((o) => o.key)
  const initialExact: Record<string, string> = {}
  if (editing) {
    for (const share of editing.shares) {
      const k = isGroup ? `m:${share.member_id}` : share.is_self ? SELF_KEY : `c:${share.contact_id}`
      initialExact[k] = String(share.share)
    }
  }

  const [description, setDescription] = useState(editing?.description ?? "")
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "")
  const [currency, setCurrency] = useState(editing?.currency ?? defaultCurrency ?? DEFAULT_USER_CURRENCY)
  const [spentOn, setSpentOn] = useState(editing?.spent_on ?? todayIso())
  const [note, setNote] = useState(editing?.note ?? "")
  const [method, setMethod] = useState<"equal" | "exact">(editing?.split_method ?? "equal")
  const [paidBy, setPaidBy] = useState(
    editing
      ? isGroup
        ? `m:${editing.paid_by_member_id}`
        : editing.paid_by_is_self
          ? SELF_KEY
          : `c:${editing.paid_by_contact_id}`
      : selfKey,
  )
  const [selectedKeys, setSelectedKeys] = useState<string[]>(initialSelected)
  const [exactValues, setExactValues] = useState<Record<string, string>>(initialExact)
  const [recordPersonal, setRecordPersonal] = useState(false)
  const [categoryId, setCategoryId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")

  const locked = Boolean(editing?.locked_by_settlement)
  const saving = create.isPending || update.isPending
  const totalMinor = parseMajorToMinor(amount, currency)
  const myShareMinor = (() => {
    if (totalMinor === null || !selectedKeys.includes(selfKey)) return 0
    if (method === "equal") return previewEqualShares(totalMinor, selectedKeys)[selfKey] ?? 0
    return parseMajorToMinor(exactValues[selfKey] ?? "0", currency) ?? 0
  })()

  function toggleParticipant(key: string) {
    setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!description.trim()) return

    if (editing && locked) {
      try {
        await update.mutateAsync({
          splitId: editing.id,
          body: { description: description.trim(), note: note.trim() || null },
        })
        toast.success(t("dialogs.split.updated"))
        onOpenChange(false)
      } catch (err) {
        toast.error(messageOf(err))
      }
      return
    }

    if (totalMinor === null || totalMinor <= 0) {
      toast.error(t("dialogs.split.invalidAmount", { currency }))
      return
    }
    if (selectedKeys.length === 0) {
      toast.error(t("dialogs.split.needParticipants"))
      return
    }

    const exactShares =
      method === "exact"
        ? selectedKeys.map((key) => ({
            member_id: isGroup ? Number(key.replace("m:", "")) : null,
            contact_id: !isGroup && key !== SELF_KEY ? Number(key.replace("c:", "")) : null,
            is_self: !isGroup && key === SELF_KEY,
            amount: (exactValues[key] ?? "0").trim() || "0",
          }))
        : []

    if (method === "exact") {
      let sum = 0
      for (const share of exactShares) {
        const parsed = parseMajorToMinor(share.amount, currency)
        if (parsed === null) {
          toast.error(t("dialogs.split.invalidAmount", { currency }))
          return
        }
        sum += parsed
      }
      if (sum !== totalMinor) {
        toast.error(t("dialogs.split.exactMismatch"))
        return
      }
    }

    if (!editing && recordPersonal && !categoryId) {
      toast.error(t("dialogs.split.needCategory"))
      return
    }

    try {
      const memberIds = isGroup ? selectedKeys.map((k) => Number(k.replace("m:", ""))) : []
      const contactIds = !isGroup
        ? selectedKeys.filter((k) => k !== SELF_KEY).map((k) => Number(k.replace("c:", "")))
        : []
      const includeSelf = !isGroup && selectedKeys.includes(SELF_KEY)

      if (editing) {
        await update.mutateAsync({
          splitId: editing.id,
          body: {
            description: description.trim(),
            note: note.trim() || null,
            amount,
            currency,
            spent_on: spentOn,
            split_method: method,
            paid_by_member_id: isGroup ? Number(paidBy.replace("m:", "")) : null,
            participant_member_ids: isGroup ? memberIds : null,
            paid_by_contact_id: !isGroup && paidBy !== SELF_KEY ? Number(paidBy.replace("c:", "")) : null,
            participant_contact_ids: !isGroup ? contactIds : null,
            include_self: includeSelf,
            exact_shares: method === "exact" ? exactShares : null,
          },
        })
        toast.success(t("dialogs.split.updated"))
      } else {
        const saved = await create.mutateAsync({
          description: description.trim(),
          amount,
          currency,
          spent_on: spentOn,
          note: note.trim() || null,
          group_id: groupId,
          split_method: method,
          paid_by_member_id: isGroup ? Number(paidBy.replace("m:", "")) : null,
          participant_member_ids: memberIds,
          paid_by_contact_id: !isGroup && paidBy !== SELF_KEY ? Number(paidBy.replace("c:", "")) : null,
          participant_contact_ids: contactIds,
          include_self: includeSelf,
          exact_shares: exactShares,
          record_my_share:
            recordPersonal && myShareMinor > 0
              ? { category_id: Number(categoryId), payment_method: paymentMethod }
              : null,
        })
        toast.success(t("dialogs.split.saved"))
        for (const notice of saved.notices) toast.warning(notice)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(messageOf(err))
    }
  }

  const methodLabels = PAYMENT_METHOD_LABELS[language]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("dialogs.split.editTitle") : t("dialogs.split.addTitle")}</DialogTitle>
          <DialogDescription>
            {groupName ? `${groupName} · ${t("dialogs.split.description")}` : t("dialogs.split.description")}
          </DialogDescription>
        </DialogHeader>

        {locked && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            {t("dialogs.split.lockedNotice")}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3.5">
          <LabeledField id="split-desc" label={t("dialogs.split.titleLabel")}>
            <Input
              id="split-desc"
              required
              maxLength={SPLITS.limits.descriptionLength}
              placeholder={t("dialogs.split.titlePlaceholder")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </LabeledField>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <LabeledField id="split-amount" label={t("dialogs.split.amountLabel")}>
              <Input
                id="split-amount"
                type="text"
                inputMode="decimal"
                required
                disabled={locked}
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </LabeledField>
            <LabeledField id="split-currency" label={t("dialogs.split.currencyLabel")}>
              <CurrencySelect id="split-currency" value={currency} onChange={setCurrency} disabled={locked} />
            </LabeledField>
            <LabeledField id="split-date" label={t("dialogs.split.dateLabel")}>
              <Input
                id="split-date"
                type="date"
                required
                disabled={locked}
                value={spentOn}
                onChange={(e) => setSpentOn(e.target.value)}
              />
            </LabeledField>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <LabeledField id="split-paid-by" label={t("dialogs.split.paidByLabel")}>
              <Select value={paidBy} onValueChange={setPaidBy} disabled={locked}>
                <SelectTrigger id="split-paid-by" className="w-full">
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

            <div className="flex flex-col gap-1.5">
              <Label>{t("dialogs.split.methodLabel")}</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["equal", "exact"] as const).map((option) => (
                  <Button
                    key={option}
                    type="button"
                    size="sm"
                    disabled={locked}
                    variant={method === option ? "default" : "outline"}
                    onClick={() => setMethod(option)}
                  >
                    {option === "equal" ? t("dialogs.split.equal") : t("dialogs.split.exact")}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <SplitParticipantsField
            options={options}
            selectedKeys={selectedKeys}
            method={method}
            totalMinor={totalMinor}
            currency={currency}
            exactValues={exactValues}
            disabled={locked}
            onToggle={toggleParticipant}
            onExactChange={(key, value) => setExactValues((prev) => ({ ...prev, [key]: value }))}
          />

          <LabeledField id="split-note" label={t("dialogs.split.noteLabel")}>
            <Input
              id="split-note"
              maxLength={SPLITS.limits.noteLength}
              placeholder={t("dialogs.split.notePlaceholder")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </LabeledField>

          {!editing && myShareMinor > 0 && (
            <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("dialogs.split.personalExpenseSection")}</p>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={recordPersonal} onCheckedChange={(c) => setRecordPersonal(c === true)} />
                <span>
                  {t("dialogs.split.recordMyShareToggle", {
                    amount: formatMoney(formatMinorToMajor(myShareMinor, currency), currency),
                  })}
                </span>
              </label>
              {recordPersonal && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <LabeledField id="split-category" label={t("dialogs.split.categoryLabel")}>
                    <CategorySelect id="split-category" value={categoryId} onChange={setCategoryId} />
                  </LabeledField>
                  <LabeledField id="split-pay-method" label={t("dialogs.split.paymentMethodLabel")}>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger id="split-pay-method" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethodValues.map((m) => (
                          <SelectItem key={m} value={m}>
                            {methodLabels[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </LabeledField>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("dialogs.cancel")}
            </Button>
            <Button type="submit" disabled={saving || !description.trim()}>
              {saving ? t("dialogs.saving") : t("dialogs.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
