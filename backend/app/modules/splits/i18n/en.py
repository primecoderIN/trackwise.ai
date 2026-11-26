"""The splits module's texts for people, in English: keys and source templates (splits module, i18n/).

Used by domain rules, access checks, commands, and queries for localized RFC 9457 error details.
hi.py translates every key; __init__.py registers and validates the catalog at startup.
"""

from enum import StrEnum

from app.core.i18n import TextValue


class SplitText(StrEnum):
    """The splits module's localized error and status message keys."""

    CONTACT_NOT_FOUND = "errors.contactNotFound"
    CONTACT_DUPLICATE = "errors.contactDuplicate"
    CONTACT_IN_USE = "errors.contactInUse"
    CONTACT_ARCHIVED = "errors.contactArchived"
    GROUP_NOT_FOUND = "errors.groupNotFound"
    GROUP_DUPLICATE = "errors.groupDuplicate"
    GROUP_IN_USE = "errors.groupInUse"
    GROUP_ARCHIVED = "errors.groupArchived"
    GROUP_NOT_SHARED = "errors.groupNotShared"
    GROUP_ALREADY_SHARED = "errors.groupAlreadyShared"
    GROUP_OWNER_REQUIRED = "errors.groupOwnerRequired"
    MEMBER_NOT_FOUND = "errors.memberNotFound"
    MEMBER_HAS_BALANCE = "errors.memberHasBalance"
    OWNER_CANNOT_LEAVE = "errors.ownerCannotLeave"
    TRANSFER_TARGET_INVALID = "errors.transferTargetInvalid"
    INVITE_INVALID = "errors.inviteInvalid"
    INVITE_NOT_FOUND = "errors.inviteNotFound"
    INVITE_LIMIT_REACHED = "errors.inviteLimitReached"
    SEAT_ALREADY_CLAIMED = "errors.seatAlreadyClaimed"
    REJOIN_CANNOT_CLAIM_SEAT = "errors.rejoinCannotClaimSeat"
    SPLIT_NOT_FOUND = "errors.splitNotFound"
    SPLIT_EDIT_FORBIDDEN = "errors.splitEditForbidden"
    SPLIT_LOCKED_BY_SETTLEMENT = "errors.splitLockedBySettlement"
    SETTLEMENT_NOT_FOUND = "errors.settlementNotFound"
    SETTLEMENT_VOID_FORBIDDEN = "errors.settlementVoidForbidden"
    SETTLEMENT_ALREADY_VOIDED = "errors.settlementAlreadyVoided"
    SETTLEMENT_SAME_PARTY = "errors.settlementSameParty"
    AMOUNT_NOT_POSITIVE = "errors.amountNotPositive"
    AMOUNT_PRECISION = "errors.amountPrecision"
    INVALID_UPI_ID = "errors.invalidUpiId"
    PARTICIPANTS_REQUIRED = "errors.participantsRequired"
    DUPLICATE_PARTICIPANT = "errors.duplicateParticipant"
    DIRECT_SPLIT_NEEDS_SELF = "errors.directSplitNeedsSelf"
    DIRECT_SPLIT_NEEDS_CONTACT = "errors.directSplitNeedsContact"
    EXACT_SHARES_REQUIRED = "errors.exactSharesRequired"
    SHARES_MUST_MATCH_TOTAL = "errors.sharesMustMatchTotal"
    NEGATIVE_SHARE = "errors.negativeShare"
    LINK_AND_RECORD_EXCLUSIVE = "errors.linkAndRecordExclusive"
    LINKED_EXPENSE_NOT_FOUND = "errors.linkedExpenseNotFound"
    NO_SELF_SHARE = "errors.noSelfShare"
    CATEGORY_NOT_FOUND = "errors.categoryNotFound"
    RECORDING_IN_PROGRESS = "errors.recordingInProgress"
    EXPENSE_LINK_NOT_FOUND = "errors.expenseLinkNotFound"


EN: dict[SplitText, TextValue] = {
    SplitText.CONTACT_NOT_FOUND: "Contact not found.",
    SplitText.CONTACT_DUPLICATE: "You already have a contact named '{name}'.",
    SplitText.CONTACT_IN_USE: "This contact is used in groups, splits, or settlements. Archive them instead.",
    SplitText.CONTACT_ARCHIVED: "Archived contacts cannot be added to new splits or groups.",
    SplitText.GROUP_NOT_FOUND: "Group not found.",
    SplitText.GROUP_DUPLICATE: "You already have a group named '{name}'.",
    SplitText.GROUP_IN_USE: "This group has splits or settlements. Archive it instead of deleting.",
    SplitText.GROUP_ARCHIVED: "This group is archived and read-only. Unarchive it first to make changes.",
    SplitText.GROUP_NOT_SHARED: "Only shared groups support invite links and multi-user membership.",
    SplitText.GROUP_ALREADY_SHARED: "This group is already a shared group.",
    SplitText.GROUP_OWNER_REQUIRED: "Only the group owner can perform this action.",
    SplitText.MEMBER_NOT_FOUND: "Group member not found.",
    SplitText.MEMBER_HAS_BALANCE: "This member still has an unsettled balance in the group.",
    SplitText.OWNER_CANNOT_LEAVE: "Transfer group ownership to another member before leaving, or archive the group.",
    SplitText.TRANSFER_TARGET_INVALID: "Ownership can only be transferred to another active registered member.",
    SplitText.INVITE_INVALID: "This invite link is invalid, expired, revoked, or has already been used.",
    SplitText.INVITE_NOT_FOUND: "Invite not found.",
    SplitText.INVITE_LIMIT_REACHED: "You can have at most {limit} active invite links per group.",
    SplitText.SEAT_ALREADY_CLAIMED: "That guest seat is no longer available to claim.",
    SplitText.REJOIN_CANNOT_CLAIM_SEAT: (
        "You were previously a member of this group; rejoin to restore your original membership instead of claiming "
        "another seat."
    ),
    SplitText.SPLIT_NOT_FOUND: "Split expense not found.",
    SplitText.SPLIT_EDIT_FORBIDDEN: "Only the split creator or group owner can edit or delete this split.",
    SplitText.SPLIT_LOCKED_BY_SETTLEMENT: (
        "A settlement has already been recorded for this balance. Void the settlement first or add an adjustment split."
    ),
    SplitText.SETTLEMENT_NOT_FOUND: "Settlement not found.",
    SplitText.SETTLEMENT_VOID_FORBIDDEN: "Only the person who recorded this settlement or the group owner can void it.",
    SplitText.SETTLEMENT_ALREADY_VOIDED: "This settlement has already been voided.",
    SplitText.SETTLEMENT_SAME_PARTY: "The payer and receiver of a settlement must be different people.",
    SplitText.AMOUNT_NOT_POSITIVE: "Amount must be greater than zero.",
    SplitText.AMOUNT_PRECISION: "Amount for {currency} allows at most {decimals} decimal places.",
    SplitText.INVALID_UPI_ID: "Enter a valid UPI ID such as name@bank.",
    SplitText.PARTICIPANTS_REQUIRED: "Choose at least one participant for the split.",
    SplitText.DUPLICATE_PARTICIPANT: "Each participant can appear only once in a split.",
    SplitText.DIRECT_SPLIT_NEEDS_SELF: "A direct split must involve you as either the payer or a participant.",
    SplitText.DIRECT_SPLIT_NEEDS_CONTACT: "A direct split must include at least one contact.",
    SplitText.EXACT_SHARES_REQUIRED: "Provide an exact share amount for every participant.",
    SplitText.SHARES_MUST_MATCH_TOTAL: "The individual shares must add up to the total amount.",
    SplitText.NEGATIVE_SHARE: "Each participant's share must be zero or more.",
    SplitText.LINK_AND_RECORD_EXCLUSIVE: (
        "Choose either an existing expense to link or record your share as a new expense, not both."
    ),
    SplitText.LINKED_EXPENSE_NOT_FOUND: "Linked expense not found.",
    SplitText.NO_SELF_SHARE: "You do not have a positive share in this split to record as a personal expense.",
    SplitText.CATEGORY_NOT_FOUND: "Category {category_id} does not exist.",
    SplitText.RECORDING_IN_PROGRESS: (
        "Your share is already being recorded. Refresh or link an existing expense if it was interrupted."
    ),
    SplitText.EXPENSE_LINK_NOT_FOUND: "No linked personal expense found for this split.",
}
