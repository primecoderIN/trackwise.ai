// TanStack Query keys, hooks, and mutations for the Splits feature. Every mutation declares its changed DATA_SCOPES
// in `meta.changes` so app/_shell/query-client.ts decides what refreshes (including Expenses/Budgets when recording a
// personal share).

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"

import { DATA_SCOPES } from "@/shared/config/data-scopes"

import {
  acceptGroupInvite,
  type ContactChanges,
  createContact,
  createGroup,
  createGroupInvite,
  createSplitExpense,
  deleteContact,
  deleteGroup,
  deleteSplitExpense,
  getGroupDetail,
  getSplitsOverview,
  type GroupChanges,
  leaveGroup,
  linkSplitExpense,
  listSettlements,
  listSplitExpenses,
  type NewContact,
  type NewGroup,
  type NewGroupInvite,
  type NewSettlement,
  type NewSplitExpense,
  previewGroupInvite,
  type RecordMyShareInput,
  recordMyShare,
  recordSettlement,
  revokeGroupInvite,
  type SettlementFilters,
  type SplitExpenseChanges,
  type SplitFilters,
  type SplitProfileUpdate,
  transferGroupOwnership,
  unlinkSplitExpense,
  updateContact,
  updateGroup,
  updateSplitExpense,
  updateSplitProfile,
  voidSettlement,
} from "./api"

/** Root and scoped TanStack Query cache keys for the Splits feature. */
export const splitKeys = {
  all: ["splits"] as const,
  overview: (includeArchived: boolean) => [...splitKeys.all, "overview", includeArchived] as const,
  group: (groupId: number) => [...splitKeys.all, "group", groupId] as const,
  expenses: (filters: SplitFilters) => [...splitKeys.all, "expenses", filters] as const,
  settlements: (filters: SettlementFilters) => [...splitKeys.all, "settlements", filters] as const,
  invitePreview: (token: string) => [...splitKeys.all, "invite-preview", token] as const,
}

/** Loads the Splits overview snapshot (non-netted totals, groups, context-isolated people, contacts, profile). */
export function useSplitsOverview(includeArchived = false) {
  return useQuery({
    queryKey: splitKeys.overview(includeArchived),
    queryFn: ({ signal }) => getSplitsOverview(includeArchived, signal),
    placeholderData: keepPreviousData,
  })
}

/** Loads full details, balances, simplified transfers, invites, and activity for one group. */
export function useGroupDetail(groupId: number | null) {
  return useQuery({
    queryKey: splitKeys.group(groupId ?? 0),
    queryFn: ({ signal }) => getGroupDetail(groupId!, signal),
    enabled: groupId !== null,
  })
}

/** Lists split expenses matching `filters`. */
export function useSplitExpenses(filters: SplitFilters = {}) {
  return useQuery({
    queryKey: splitKeys.expenses(filters),
    queryFn: ({ signal }) => listSplitExpenses(filters, signal),
    placeholderData: keepPreviousData,
  })
}

/** Lists active and voided settlements matching `filters`. */
export function useSplitSettlements(filters: SettlementFilters = {}) {
  return useQuery({
    queryKey: splitKeys.settlements(filters),
    queryFn: ({ signal }) => listSettlements(filters, signal),
    placeholderData: keepPreviousData,
  })
}

/** Previews safe group metadata for a shared invite token. */
export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: splitKeys.invitePreview(token),
    queryFn: ({ signal }) => previewGroupInvite(token, signal),
    enabled: token.trim().length > 0,
    retry: false,
  })
}

/** Updates the signed-in user's own optional UPI receive profile. */
export function useUpdateSplitProfile() {
  return useMutation({
    mutationFn: (body: SplitProfileUpdate) => updateSplitProfile(body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Creates a private contact. */
export function useCreateContact() {
  return useMutation({
    mutationFn: (body: NewContact) => createContact(body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Edits or archives a private contact. */
export function useUpdateContact() {
  return useMutation({
    mutationFn: ({ contactId, body }: { contactId: number; body: ContactChanges }) => updateContact(contactId, body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Permanently deletes an unreferenced contact. */
export function useDeleteContact() {
  return useMutation({
    mutationFn: (contactId: number) => deleteContact(contactId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Creates a Personal or Shared group. */
export function useCreateGroup() {
  return useMutation({
    mutationFn: (body: NewGroup) => createGroup(body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Applies owner-only updates to a group (rename, upgrade to Shared, members, archive). */
export function useUpdateGroup() {
  return useMutation({
    mutationFn: ({ groupId, body }: { groupId: number; body: GroupChanges }) => updateGroup(groupId, body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Deletes an empty group (owner-only). */
export function useDeleteGroup() {
  return useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Leaves a Shared group (non-owner only, zero balance required). */
export function useLeaveGroup() {
  return useMutation({
    mutationFn: (groupId: number) => leaveGroup(groupId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Transfers Shared group ownership to another active registered member. */
export function useTransferOwnership() {
  return useMutation({
    mutationFn: ({ groupId, targetMemberId }: { groupId: number; targetMemberId: number }) =>
      transferGroupOwnership(groupId, targetMemberId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Generates a one-time hashed invite link for a Shared group. */
export function useCreateGroupInvite() {
  return useMutation({
    mutationFn: ({ groupId, body }: { groupId: number; body: NewGroupInvite }) => createGroupInvite(groupId, body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Soft-revokes a Shared group invite link. */
export function useRevokeGroupInvite() {
  return useMutation({
    mutationFn: ({ groupId, inviteId }: { groupId: number; inviteId: number }) => revokeGroupInvite(groupId, inviteId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Accepts a Shared group invite token, optionally claiming a guest seat. */
export function useAcceptGroupInvite() {
  return useMutation({
    mutationFn: ({ token, claimMemberId }: { token: string; claimMemberId?: number }) =>
      acceptGroupInvite(token, claimMemberId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Creates a split expense (invalidates both splits and expenses/budgets when recording caller's own share). */
export function useCreateSplitExpense() {
  return useMutation({
    mutationFn: (body: NewSplitExpense) => createSplitExpense(body),
    meta: { changes: [DATA_SCOPES.splits, DATA_SCOPES.expenses] },
  })
}

/** Updates a split expense. */
export function useUpdateSplitExpense() {
  return useMutation({
    mutationFn: ({ splitId, body }: { splitId: number; body: SplitExpenseChanges }) =>
      updateSplitExpense(splitId, body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Deletes an unlocked split expense. */
export function useDeleteSplitExpense() {
  return useMutation({
    mutationFn: (splitId: number) => deleteSplitExpense(splitId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Records caller's own share of an existing split into personal Expenses & Budgets. */
export function useRecordMyShare() {
  return useMutation({
    mutationFn: ({ splitId, body }: { splitId: number; body: RecordMyShareInput }) => recordMyShare(splitId, body),
    meta: { changes: [DATA_SCOPES.splits, DATA_SCOPES.expenses] },
  })
}

/** Privately links an existing personal expense to a split. */
export function useLinkSplitExpense() {
  return useMutation({
    mutationFn: ({ splitId, expenseId }: { splitId: number; expenseId: number }) =>
      linkSplitExpense(splitId, expenseId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Detaches caller's private expense link from a split. */
export function useUnlinkSplitExpense() {
  return useMutation({
    mutationFn: (splitId: number) => unlinkSplitExpense(splitId),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Records a full or partial settlement repayment. */
export function useRecordSettlement() {
  return useMutation({
    mutationFn: (body: NewSettlement) => recordSettlement(body),
    meta: { changes: DATA_SCOPES.splits },
  })
}

/** Soft-voids a recorded settlement (creator or group owner only). */
export function useVoidSettlement() {
  return useMutation({
    mutationFn: (settlementId: number) => voidSettlement(settlementId),
    meta: { changes: DATA_SCOPES.splits },
  })
}
