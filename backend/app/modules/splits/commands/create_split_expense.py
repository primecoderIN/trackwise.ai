"""CreateSplitExpense: create a direct or group split expense with exact minor-unit shares (splits command slice)."""

from pydantic import BaseModel, ConfigDict, Field

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError, NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.core.money import DEFAULT_CURRENCY, SupportedCurrencyCode
from app.modules import categories, expenses
from app.modules.splits.commands.split_input import (
    ExactShareInput,
    RecordMyShareInput,
    resolve_direct_shares,
    resolve_group_shares,
)
from app.modules.splits.domain.access import require_group_member, require_group_writable
from app.modules.splits.domain.rules import parse_amount_minor
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitExpense, SplitExpenseLink, SplitShare
from app.modules.splits.values import (
    MAX_PARTICIPANTS,
    ContactId,
    ExpenseLinkStatus,
    GroupId,
    MemberId,
    SplitAmount,
    SplitDate,
    SplitDescription,
    SplitMethod,
    SplitNote,
)


# REST body for POST /splits (no owner_id; server supplies it from session, D190).
class NewSplitExpense(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    description: SplitDescription
    amount: SplitAmount
    currency: SupportedCurrencyCode = DEFAULT_CURRENCY
    spent_on: SplitDate
    note: SplitNote | None = None
    group_id: GroupId | None = None
    split_method: SplitMethod = SplitMethod.EQUAL
    # Group split inputs (used when group_id is set).
    paid_by_member_id: MemberId | None = None
    participant_member_ids: list[MemberId] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
    # Direct split inputs (used when group_id is None; paid_by_contact_id=None means caller paid).
    paid_by_contact_id: ContactId | None = None
    participant_contact_ids: list[ContactId] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
    include_self: bool = True
    # Used when split_method == "exact".
    exact_shares: list[ExactShareInput] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
    # Optional private personal-expense integration (mutually exclusive, D226).
    linked_expense_id: expenses.ExpenseId | None = None
    record_my_share: RecordMyShareInput | None = None


class CreateSplitExpense(Command[int]):
    """Persist a direct or group split expense, its shares, and optional private expense link; returns split id."""

    owner_id: UserId
    split: NewSplitExpense


def create_split_expense(ctx: Context, command: CreateSplitExpense) -> int:
    """Validate inputs, resolve Equal/Exact shares, and stage split_expense + split_share rows."""
    body = command.split
    if body.linked_expense_id is not None and body.record_my_share is not None:
        raise BusinessRuleError(translatable(SplitText.LINK_AND_RECORD_EXCLUSIVE))

    if (
        body.record_my_share is not None
        and ctx.bus.ask(categories.GetCategory(category_id=body.record_my_share.category_id)) is None
    ):
        raise BusinessRuleError(
            translatable(SplitText.CATEGORY_NOT_FOUND, category_id=body.record_my_share.category_id)
        )
    if body.linked_expense_id is not None:
        try:
            ctx.bus.ask(expenses.GetExpense(owner_id=command.owner_id, expense_id=body.linked_expense_id))
        except NotFoundError as exc:
            raise NotFoundError(translatable(SplitText.LINKED_EXPENSE_NOT_FOUND)) from exc

    amount_minor = parse_amount_minor(body.amount, body.currency)
    now = ctx.clock.now()
    note = body.note.strip() if body.note else None

    if body.group_id is not None:
        group, my_member = require_group_member(ctx.session, body.group_id, command.owner_id)
        require_group_writable(group)
        assert my_member.id is not None
        payer_id = my_member.id if body.paid_by_member_id is None else body.paid_by_member_id
        paid_by_member, member_shares = resolve_group_shares(
            ctx.session,
            body.group_id,
            amount_minor=amount_minor,
            currency=body.currency,
            split_method=body.split_method,
            paid_by_member_id=payer_id,
            participant_member_ids=body.participant_member_ids,
            exact_shares=body.exact_shares,
        )
        my_share_minor = next((share for mid, share in member_shares if mid == my_member.id), 0)
        if body.record_my_share is not None and my_share_minor <= 0:
            raise BusinessRuleError(translatable(SplitText.NO_SELF_SHARE))
        row = SplitExpense(
            owner_id=command.owner_id,
            group_id=body.group_id,
            description=body.description.strip(),
            amount_minor=amount_minor,
            currency=body.currency,
            paid_by_member_id=paid_by_member,
            paid_by_contact_id=None,
            split_method=body.split_method.value,
            spent_on=body.spent_on,
            note=note or None,
            created_at=now,
        )
        ctx.session.add(row)
        ctx.session.flush()
        assert row.id is not None
        for member_id, share_minor in member_shares:
            ctx.session.add(
                SplitShare(split_expense_id=row.id, member_id=member_id, contact_id=None, share_minor=share_minor)
            )
    else:
        paid_by_contact, direct_shares = resolve_direct_shares(
            ctx.session,
            command.owner_id,
            amount_minor=amount_minor,
            currency=body.currency,
            split_method=body.split_method,
            paid_by_contact_id=body.paid_by_contact_id,
            participant_contact_ids=body.participant_contact_ids,
            include_self=body.include_self,
            exact_shares=body.exact_shares,
        )
        my_share_minor = next((share for cid, share in direct_shares if cid is None), 0)
        if body.record_my_share is not None and my_share_minor <= 0:
            raise BusinessRuleError(translatable(SplitText.NO_SELF_SHARE))
        row = SplitExpense(
            owner_id=command.owner_id,
            group_id=None,
            description=body.description.strip(),
            amount_minor=amount_minor,
            currency=body.currency,
            paid_by_member_id=None,
            paid_by_contact_id=paid_by_contact,
            split_method=body.split_method.value,
            spent_on=body.spent_on,
            note=note or None,
            created_at=now,
        )
        ctx.session.add(row)
        ctx.session.flush()
        assert row.id is not None
        for contact_id, share_minor in direct_shares:
            ctx.session.add(
                SplitShare(split_expense_id=row.id, member_id=None, contact_id=contact_id, share_minor=share_minor)
            )

    if body.linked_expense_id is not None:
        ctx.session.add(
            SplitExpenseLink(
                split_expense_id=row.id,
                owner_id=command.owner_id,
                expense_id=body.linked_expense_id,
                status=ExpenseLinkStatus.LINKED.value,
                created_at=now,
                updated_at=now,
            )
        )
    ctx.session.flush()
    return row.id
