"""Shared read models for split expenses, shares, settlements, and overview snapshots (splits module)."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, computed_field

from app.core.clock import UtcDateTime
from app.core.money import minor_to_major
from app.modules.splits.models import (
    ContactRead,
    GroupMemberRead,
    GroupSummaryRead,
    InviteRead,
    MemberCurrencyBalanceRead,
    OverviewCurrencyTotal,
    PersonBalanceRead,
    SimplifiedTransferRead,
    SplitProfileRead,
)
from app.modules.splits.values import ExpenseLinkStatus, GroupKind, SplitMethod


# One participant's exact share of a split expense.
class SplitShareRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    member_id: int | None = None
    contact_id: int | None = None
    is_self: bool
    display_name: str
    share_minor: int
    currency: str

    @computed_field
    @property
    def share(self) -> Decimal:
        """Major-unit share formatted to `currency`'s minor-unit precision."""
        return minor_to_major(self.share_minor, self.currency)


# One split expense (direct or group), carrying only the caller's private expense link (D190, D226).
class SplitExpenseRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    group_id: int | None
    group_name: str | None
    group_kind: GroupKind | None
    description: str
    amount_minor: int
    currency: str
    split_method: SplitMethod
    spent_on: date
    note: str | None
    paid_by_member_id: int | None
    paid_by_contact_id: int | None
    paid_by_is_self: bool
    paid_by_name: str
    shares: list[SplitShareRead]
    my_share_minor: int
    my_linked_expense_id: int | None = None
    my_link_status: ExpenseLinkStatus | None = None
    can_edit: bool
    locked_by_settlement: bool
    created_at: UtcDateTime

    @computed_field
    @property
    def amount(self) -> Decimal:
        """Total split amount in major units."""
        return minor_to_major(self.amount_minor, self.currency)

    @computed_field
    @property
    def my_share(self) -> Decimal:
        """Caller's own share in major units (0 if caller is not a participant)."""
        return minor_to_major(self.my_share_minor, self.currency)


# Answer for POST /splits and POST /splits/{id}/record-my-share: the split plus any budget-watch notices (D212).
class SavedSplitExpense(BaseModel):
    model_config = ConfigDict(frozen=True)

    split: SplitExpenseRead
    notices: list[str]


# Paged list of split expenses.
class SplitExpenseList(BaseModel):
    model_config = ConfigDict(frozen=True)

    items: list[SplitExpenseRead]
    total: int


# One recorded settlement (active or soft-voided).
class SettlementRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    group_id: int | None
    group_name: str | None
    from_member_id: int | None
    from_contact_id: int | None
    from_is_self: bool
    from_name: str
    to_member_id: int | None
    to_contact_id: int | None
    to_is_self: bool
    to_name: str
    amount_minor: int
    currency: str
    settled_on: date
    note: str | None
    voided_at: UtcDateTime | None
    can_void: bool
    created_at: UtcDateTime

    @computed_field
    @property
    def amount(self) -> Decimal:
        """Major-unit settlement amount in `currency`."""
        return minor_to_major(self.amount_minor, self.currency)


# Paged list of settlements.
class SettlementList(BaseModel):
    model_config = ConfigDict(frozen=True)

    items: list[SettlementRead]
    total: int


# Full detail view of one group (personal or shared).
class GroupDetailRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    group: GroupSummaryRead
    members: list[GroupMemberRead]
    member_balances: list[MemberCurrencyBalanceRead]
    simplified_transfers: list[SimplifiedTransferRead]
    invites: list[InviteRead]
    splits: list[SplitExpenseRead]
    settlements: list[SettlementRead]


# Top-level snapshot returned by GET /splits/overview (strictly non-netted across contexts, D226).
class SplitsOverviewRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    totals: list[OverviewCurrencyTotal]
    groups: list[GroupSummaryRead]
    people: list[PersonBalanceRead]
    contacts: list[ContactRead]
    profile: SplitProfileRead
