// Dialog for transferring ownership of a Shared group to another active registered member (D225).

import { useTranslations } from "next-intl"
import { type FormEvent, useState } from "react"
import { toast } from "sonner"

import { LabeledField } from "@/shared/components/labeled-field"
import { useMessageOf } from "@/shared/lib/use-message-of"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

import type { GroupDetail } from "../../api"
import { useTransferOwnership } from "../../queries"

/** Props for the Shared group ownership transfer dialog. */
export interface TransferOwnershipDialogProps {
  open: boolean
  detail: GroupDetail
  onOpenChange: (open: boolean) => void
}

/** Lets a Shared group's owner pick another active registered member to become the new owner. */
export function TransferOwnershipDialog({ open, detail, onOpenChange }: TransferOwnershipDialogProps) {
  const t = useTranslations("splits")
  const messageOf = useMessageOf()
  const transfer = useTransferOwnership()
  const eligible = detail.members.filter((m) => m.is_active && m.is_registered && !m.is_self)
  const [targetId, setTargetId] = useState(eligible[0] ? String(eligible[0].id) : "")

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialogs.transfer.title")}</DialogTitle>
          <DialogDescription>{t("dialogs.transfer.description", { name: detail.group.name })}</DialogDescription>
        </DialogHeader>
        {eligible.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("dialogs.transfer.noEligible")}</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <LabeledField id="transfer-target" label={t("dialogs.transfer.memberLabel")}>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger id="transfer-target" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eligible.map((member) => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </LabeledField>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t("dialogs.cancel")}
              </Button>
              <Button type="submit" disabled={transfer.isPending || !targetId}>
                {transfer.isPending ? t("dialogs.saving") : t("dialogs.transfer.submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
