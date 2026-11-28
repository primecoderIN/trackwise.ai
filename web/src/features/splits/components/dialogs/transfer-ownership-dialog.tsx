// Dialog for transferring ownership of a Shared group to another active registered member (D225).

import { Button, Dialog, SelectField, type SelectOption } from "@primecoderin/fast-ui-react"
import { useTranslations } from "next-intl"
import { type FormEvent, useMemo, useState } from "react"

import { toast } from "@/shared/lib/toast"
import { useMessageOf } from "@/shared/lib/use-message-of"

import type { GroupDetail } from "../../api"
import { useTransferOwnership } from "../../queries"

const FORM_ID = "transfer-ownership-form"

/** Props for the Shared group ownership transfer dialog. */
export interface TransferOwnershipDialogProps {
  open: boolean
  detail: GroupDetail
  onOpenChange: (open: boolean) => void
}

/** Lets a Shared group's owner pick another active registered member to become the new owner. */
export function TransferOwnershipDialog({ open, detail, onOpenChange }: TransferOwnershipDialogProps) {
  const t = useTranslations("splits")
  const tCommon = useTranslations("common")
  const messageOf = useMessageOf()
  const transfer = useTransferOwnership()
  const eligible = detail.members.filter((m) => m.is_active && m.is_registered && !m.is_self)
  const [targetId, setTargetId] = useState(eligible[0] ? String(eligible[0].id) : "")

  const memberOptions = useMemo<SelectOption[]>(
    () => eligible.map((member) => ({ value: String(member.id), label: member.display_name })),
    [eligible],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!targetId) return
    try {
      await transfer.mutateAsync({ groupId: detail.group.id, targetMemberId: Number(targetId) })
      toast.success(t("groups.ownershipTransferred"))
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
      title={t("dialogs.transfer.title")}
      description={t("dialogs.transfer.description", { name: detail.group.name })}
      closeLabel={tCommon("ui.close")}
      actions={
        eligible.length > 0 ? (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t("dialogs.cancel")}
            </Button>
            <Button variant="primary" type="submit" form={FORM_ID} disabled={!targetId} isLoading={transfer.isPending}>
              {transfer.isPending ? t("dialogs.saving") : t("dialogs.transfer.submit")}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("dialogs.close")}
          </Button>
        )
      }
    >
      {eligible.length === 0 ? (
        <p className="text-sm text-fg-secondary">{t("dialogs.transfer.noEligible")}</p>
      ) : (
        <form id={FORM_ID} onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <SelectField
            label={t("dialogs.transfer.memberLabel")}
            options={memberOptions}
            value={targetId}
            onValueChange={setTargetId}
            size="small"
          />
        </form>
      )}
    </Dialog>
  )
}
