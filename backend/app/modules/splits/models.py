"""Shared read models for profiles, contacts, groups, invites, and overview (splits module).

Frozen Pydantic DTOs returned by queries and API routes; never table rows. Split expense and settlement DTOs live
in ledger_models.py so each file stays focused and concise.
"""

from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field

from app.core.clock import UtcDateTime
from app.core.money import minor_to_major
from app.modules.splits.values import BalanceContextKind, BalanceDirection, GroupKind, MemberRole


# One currency's balance amount (always positive magnitude, paired with `direction`).
class CurrencyBalance(BaseModel):
    model_config = ConfigDict(frozen=True)

    currency: str
    amount_minor: int
    direction: BalanceDirection

    @computed_field
    @property
    def amount(self) -> Decimal:
        """Major-unit magnitude formatted to `currency`'s minor-unit precision."""
        return minor_to_major(self.amount_minor, self.currency)


# Non-netted directional totals for one currency on the Splits overview strip (D226).
class OverviewCurrencyTotal(BaseModel):
    model_config = ConfigDict(frozen=True)

    currency: str
    owed_to_you_minor: int
    you_owe_minor: int

    @computed_field
    @property
    def owed_to_you(self) -> Decimal:
        """Major-unit sum of obligations owed to you in `currency`."""
        return minor_to_major(self.owed_to_you_minor, self.currency)

    @computed_field
    @property
    def you_owe(self) -> Decimal:
        """Major-unit sum of obligations you owe in `currency`."""
        return minor_to_major(self.you_owe_minor, self.currency)


# Signed-in user's own optional UPI receive profile.
class SplitProfileRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    upi_id: str | None = None
    share_upi_with_groups: bool = False


# One contact in the signed-in user's private contacts list.
class ContactRead(BaseModel):
    model_config = ConfigDict(frozen=True, from_attributes=True)

    id: int
    name: str
    upi_id: str | None
    note: str | None
    archived_at: UtcDateTime | None
    created_at: UtcDateTime


# One obligation inside a single context (direct 1-on-1 OR one specific group — never netted across groups, D226).
class ContextObligationRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    context_kind: BalanceContextKind
    group_id: int | None = None
    group_name: str | None = None
    group_kind: GroupKind | None = None
    member_id: int | None = None
    currency: str
    amount_minor: int
    direction: BalanceDirection

    @computed_field
    @property
    def amount(self) -> Decimal:
        """Major-unit obligation amount in `currency`."""
        return minor_to_major(self.amount_minor, self.currency)


# One row on the People tab (a personal contact or shared-group co-member) with separate per-context obligations.
class PersonBalanceRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    key: str
    display_name: str
    contact_id: int | None = None
    user_id: int | None = None
    upi_id: str | None = None
    is_contact: bool
    archived: bool = False
    obligations: list[ContextObligationRead]


# One member of a group as returned by group endpoints (never exposes another user's private contact_id or notes).
class GroupMemberRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    display_name: str
    role: MemberRole
    is_self: bool
    is_registered: bool
    is_active: bool
    upi_id: str | None = None
    joined_at: UtcDateTime
    left_at: UtcDateTime | None = None


# Summary of one group (personal or shared) in lists and overview.
class GroupSummaryRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    kind: GroupKind
    name: str
    default_currency: str | None
    my_role: MemberRole
    my_member_id: int
    member_count: int
    archived_at: UtcDateTime | None
    created_at: UtcDateTime
    my_balances: list[CurrencyBalance]


# One member's net position in a specific currency inside a group.
class MemberCurrencyBalanceRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    member_id: int
    display_name: str
    is_self: bool
    currency: str
    net_minor: int

    @computed_field
    @property
    def net(self) -> Decimal:
        """Signed major-unit net balance (+ means owed money, - means owes money)."""
        return minor_to_major(self.net_minor, self.currency)


# One suggested minimum-transfer settlement inside a group.
class SimplifiedTransferRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    from_member_id: int
    from_name: str
    from_is_self: bool
    to_member_id: int
    to_name: str
    to_is_self: bool
    to_upi_id: str | None = None
    currency: str
    amount_minor: int

    @computed_field
    @property
    def amount(self) -> Decimal:
        """Major-unit transfer amount in `currency`."""
        return minor_to_major(self.amount_minor, self.currency)


# One invite row visible to a shared group's owner (never includes raw token after creation).
class InviteRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    hint: str
    target_member_id: int | None
    target_member_name: str | None
    max_uses: int
    use_count: int
    expires_at: UtcDateTime
    revoked_at: UtcDateTime | None
    created_at: UtcDateTime
    active: bool


# Returned once when an owner creates an invite link (with Cache-Control: no-store).
class CreatedInviteRead(InviteRead):
    token: str


# One unclaimed guest seat offered to a friend previewing an invite link.
class ClaimableGuestRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    member_id: int
    display_name: str
    has_history: bool


# Minimal safe metadata returned by POST /splits/invites/preview (never leaks expenses or UPI IDs).
class InvitePreviewRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    group_name: str
    default_currency: str | None
    member_count: int
    already_member: bool
    is_rejoin: bool
    target_guest: ClaimableGuestRead | None = None
    claimable_guests: list[ClaimableGuestRead]
