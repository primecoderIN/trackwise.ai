// Typed HTTP client calls for the Splits API (/api/v1/splits/*). Part of the splits feature; types come directly
// from schema.gen.ts (never hand-copied). Used by queries.ts.

import { api, type Schemas, unwrap, unwrapEmpty } from "@/shared/api/http"

/** Complete Splits overview snapshot (non-netted per-currency totals, groups, context-isolated people, profile). */
export type SplitsOverview = Schemas["SplitsOverviewRead"]
/** Directional per-currency totals (owed to you vs. you owe). */
export type OverviewCurrencyTotal = Schemas["OverviewCurrencyTotal"]
/** User's own optional UPI receive profile. */
export type SplitProfile = Schemas["SplitProfileRead"]
/** Payload for PUT /splits/profile. */
export type SplitProfileUpdate = Schemas["SplitProfileUpdate"]
/** One private contact. */
export type SplitContact = Schemas["ContactRead"]
/** Payload for POST /splits/contacts. */
export type NewContact = Schemas["NewContact"]
/** Payload for PATCH /splits/contacts/{contact_id}. */
export type ContactChanges = Schemas["ContactChanges"]
/** One context-specific obligation (direct OR one group — never netted across groups). */
export type ContextObligation = Schemas["ContextObligationRead"]
/** One person on the People tab with separate per-context obligations. */
export type PersonBalance = Schemas["PersonBalanceRead"]
/** Summary of one Personal or Shared group. */
export type GroupSummary = Schemas["GroupSummaryRead"]
/** Full group view: members, net balances, simplified transfers, invites, splits, and settlements. */
export type GroupDetail = Schemas["GroupDetailRead"]
/** One group member (privacy-safe: never carries another user's private contact details). */
export type GroupMember = Schemas["GroupMemberRead"]
/** One suggested minimum-transfer settlement inside a group. */
export type SimplifiedTransfer = Schemas["SimplifiedTransferRead"]
/** Payload for POST /splits/groups. */
export type NewGroup = Schemas["NewGroup"]
/** Payload for PATCH /splits/groups/{group_id}. */
export type GroupChanges = Schemas["GroupChanges"]
/** Invite audit row visible to a Shared group owner. */
export type GroupInvite = Schemas["InviteRead"]
/** One-time response when creating an invite link (includes raw token). */
export type CreatedGroupInvite = Schemas["CreatedInviteRead"]
/** Payload for POST /splits/groups/{group_id}/invites. */
export type NewGroupInvite = Schemas["NewGroupInvite"]
/** Minimal safe preview returned by POST /splits/invites/preview. */
export type InvitePreview = Schemas["InvitePreviewRead"]
/** One split expense (direct or group) with caller's private expense link. */
export type SplitExpense = Schemas["SplitExpenseRead"]
/** Result of creating a split or recording caller's share (split + budget alert notices). */
export type SavedSplitExpense = Schemas["SavedSplitExpense"]
/** Paged split expenses response. */
export type SplitExpenseList = Schemas["SplitExpenseList"]
/** Payload for POST /splits. */
export type NewSplitExpense = Schemas["NewSplitExpense"]
/** Payload for PATCH /splits/{split_id}. */
export type SplitExpenseChanges = Schemas["SplitExpenseChanges"]
/** Payload for recording caller's own share into personal Expenses. */
export type RecordMyShareInput = Schemas["RecordMyShareInput"]
/** One active or soft-voided settlement. */
export type SplitSettlement = Schemas["SettlementRead"]
/** Paged settlements response. */
export type SplitSettlementList = Schemas["SettlementList"]
/** Payload for POST /splits/settlements. */
export type NewSettlement = Schemas["NewSettlement"]

/** Query filters for GET /splits. */
export interface SplitFilters {
  group_id?: number
  contact_id?: number
  currency?: string
  limit?: number
  offset?: number
}

/** Query filters for GET /splits/settlements. */
export interface SettlementFilters {
  group_id?: number
  contact_id?: number
  currency?: string
  include_voided?: boolean
  limit?: number
  offset?: number
}

/** Fetches the Splits overview snapshot (totals, groups, people, contacts, and UPI profile). */
export function getSplitsOverview(includeArchived = false, signal?: AbortSignal): Promise<SplitsOverview> {
  return unwrap(
    api.GET("/api/v1/splits/overview", { params: { query: { include_archived: includeArchived } }, signal }),
  )
}

/** Updates the signed-in user's optional UPI receive profile and group-sharing opt-in. */
export function updateSplitProfile(body: SplitProfileUpdate): Promise<SplitProfile> {
  return unwrap(api.PUT("/api/v1/splits/profile", { body }))
}

/** Creates a private contact. */
export function createContact(body: NewContact): Promise<SplitContact> {
  return unwrap(api.POST("/api/v1/splits/contacts", { body }))
}

/** Updates a private contact's name, UPI ID, note, or archive state. */
export function updateContact(contactId: number, body: ContactChanges): Promise<SplitContact> {
  return unwrap(
    api.PATCH("/api/v1/splits/contacts/{contact_id}", { params: { path: { contact_id: contactId } }, body }),
  )
}

/** Permanently removes an unused private contact. */
export function deleteContact(contactId: number): Promise<void> {
  return unwrapEmpty(
    api.DELETE("/api/v1/splits/contacts/{contact_id}", { params: { path: { contact_id: contactId } } }),
  )
}

/** Fetches full detail for one Personal or Shared group. */
export function getGroupDetail(groupId: number, signal?: AbortSignal): Promise<GroupDetail> {
  return unwrap(api.GET("/api/v1/splits/groups/{group_id}", { params: { path: { group_id: groupId } }, signal }))
}

/** Creates a Personal or Shared group. */
export function createGroup(body: NewGroup): Promise<GroupDetail> {
  return unwrap(api.POST("/api/v1/splits/groups", { body }))
}

/** Applies owner-only updates to a group (rename, currency, upgrade to Shared, members, archive). */
export function updateGroup(groupId: number, body: GroupChanges): Promise<GroupDetail> {
  return unwrap(api.PATCH("/api/v1/splits/groups/{group_id}", { params: { path: { group_id: groupId } }, body }))
}

/** Deletes an empty group (owner-only). */
export function deleteGroup(groupId: number): Promise<void> {
  return unwrapEmpty(api.DELETE("/api/v1/splits/groups/{group_id}", { params: { path: { group_id: groupId } } }))
}

/** Leaves a Shared group (non-owner only, requires zero balance). */
export function leaveGroup(groupId: number): Promise<void> {
  return unwrapEmpty(api.POST("/api/v1/splits/groups/{group_id}/leave", { params: { path: { group_id: groupId } } }))
}

/** Transfers ownership of a Shared group to another active registered member. */
export function transferGroupOwnership(groupId: number, targetMemberId: number): Promise<GroupDetail> {
  return unwrap(
    api.POST("/api/v1/splits/groups/{group_id}/transfer-ownership", {
      params: { path: { group_id: groupId } },
      body: { target_member_id: targetMemberId },
    }),
  )
}

/** Creates a one-time hashed invite link for a Shared group (owner-only). */
export function createGroupInvite(groupId: number, body: NewGroupInvite): Promise<CreatedGroupInvite> {
  return unwrap(api.POST("/api/v1/splits/groups/{group_id}/invites", { params: { path: { group_id: groupId } }, body }))
}

/** Soft-revokes a Shared group invite link (owner-only). */
export function revokeGroupInvite(groupId: number, inviteId: number): Promise<void> {
  return unwrapEmpty(
    api.DELETE("/api/v1/splits/groups/{group_id}/invites/{invite_id}", {
      params: { path: { group_id: groupId, invite_id: inviteId } },
    }),
  )
}

/** Previews safe group metadata for a shared invite token (sent in JSON body, never query string). */
export function previewGroupInvite(token: string, signal?: AbortSignal): Promise<InvitePreview> {
  return unwrap(api.POST("/api/v1/splits/invites/preview", { body: { token }, signal }))
}

/** Atomically accepts a shared invite token, optionally claiming a guest seat. */
export function acceptGroupInvite(token: string, claimMemberId?: number): Promise<{ group_id: number }> {
  return unwrap(
    api.POST("/api/v1/splits/invites/accept", {
      body: claimMemberId !== undefined ? { token, claim_member_id: claimMemberId } : { token },
    }),
  )
}

/** Lists split expenses visible to the signed-in user. */
export function listSplitExpenses(filters: SplitFilters = {}, signal?: AbortSignal): Promise<SplitExpenseList> {
  return unwrap(api.GET("/api/v1/splits", { params: { query: filters }, signal }))
}

/** Creates a direct or group split expense (optionally recording caller's own share into personal Expenses). */
export function createSplitExpense(body: NewSplitExpense): Promise<SavedSplitExpense> {
  return unwrap(api.POST("/api/v1/splits", { body }))
}

/** Updates a split expense (metadata or, when unlocked, financial fields). */
export function updateSplitExpense(splitId: number, body: SplitExpenseChanges): Promise<SplitExpense> {
  return unwrap(api.PATCH("/api/v1/splits/{split_id}", { params: { path: { split_id: splitId } }, body }))
}

/** Deletes an unlocked split expense (creator or group owner only). */
export function deleteSplitExpense(splitId: number): Promise<void> {
  return unwrapEmpty(api.DELETE("/api/v1/splits/{split_id}", { params: { path: { split_id: splitId } } }))
}

/** Idempotently records strictly the caller's own share of a split into their private Expenses & Budgets. */
export function recordMyShare(splitId: number, body: RecordMyShareInput): Promise<SavedSplitExpense> {
  return unwrap(
    api.POST("/api/v1/splits/{split_id}/record-my-share", { params: { path: { split_id: splitId } }, body }),
  )
}

/** Privately links an existing personal expense to a split (also recovers interrupted recording states). */
export function linkSplitExpense(splitId: number, expenseId: number): Promise<SplitExpense> {
  return unwrap(
    api.PUT("/api/v1/splits/{split_id}/link-expense", {
      params: { path: { split_id: splitId } },
      body: { expense_id: expenseId },
    }),
  )
}

/** Removes the caller's private expense link from a split without deleting the personal expense. */
export function unlinkSplitExpense(splitId: number): Promise<void> {
  return unwrapEmpty(api.DELETE("/api/v1/splits/{split_id}/link-expense", { params: { path: { split_id: splitId } } }))
}

/** Lists active and soft-voided settlements visible to the signed-in user. */
export function listSettlements(filters: SettlementFilters = {}, signal?: AbortSignal): Promise<SplitSettlementList> {
  return unwrap(api.GET("/api/v1/splits/settlements", { params: { query: filters }, signal }))
}

/** Records a full or partial direct or group settlement. */
export function recordSettlement(body: NewSettlement): Promise<SplitSettlement> {
  return unwrap(api.POST("/api/v1/splits/settlements", { body }))
}

/** Soft-voids a recorded settlement (creator or group owner only). */
export function voidSettlement(settlementId: number): Promise<SplitSettlement> {
  return unwrap(
    api.POST("/api/v1/splits/settlements/{settlement_id}/void", { params: { path: { settlement_id: settlementId } } }),
  )
}
