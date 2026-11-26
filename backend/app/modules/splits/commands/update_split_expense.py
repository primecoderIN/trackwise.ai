"""UpdateSplitExpense: edit split metadata or (when unlocked) financial terms (splits command slice)."""

from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlmodel import col, delete, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.core.money import SupportedCurrencyCode
from app.modules.splits.commands.split_input import ExactShareInput, resolve_direct_shares, resolve_group_shares
from app.modules.splits.domain.access import is_split_locked_by_settlement, require_split_edit_access
from app.modules.splits.domain.rules import parse_amount_minor
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitShare
from app.modules.splits.values import (
    MAX_PARTICIPANTS,
    ContactId,
    MemberId,
    SplitAmount,
    SplitDate,
    SplitDescription,
    SplitExpenseId,
    SplitMethod,
    SplitNote,
)

FINANCIAL_FIELDS = frozenset(
    {
        "amount",
        "currency",
        "spent_on",
        "split_method",
        "paid_by_member_id",
        "participant_member_ids",
        "paid_by_contact_id",
        "participant_contact_ids",
        "include_self",
        "exact_shares",
    }
)


# REST body for PATCH /splits/{split_id}; creator or group owner only (D226).
class SplitExpenseChanges(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    description: SplitDescription | None = None
    note: SplitNote | None = None
    amount: SplitAmount | None = None
    currency: SupportedCurrencyCode | None = None
    spent_on: SplitDate | None = None
    split_method: SplitMethod | None = None
    paid_by_member_id: MemberId | None = None
    participant_member_ids: list[MemberId] | None = Field(default=None, max_length=MAX_PARTICIPANTS)
    paid_by_contact_id: ContactId | None = None
    participant_contact_ids: list[ContactId] | None = Field(default=None, max_length=MAX_PARTICIPANTS)
    include_self: bool | None = None
    exact_shares: list[ExactShareInput] | None = Field(default=None, max_length=MAX_PARTICIPANTS)

    @model_validator(mode="after")
    def reject_null_required(self) -> Self:
        """Refuse explicit null on non-nullable fields."""
        for field in ("description", "amount", "currency", "spent_on", "split_method", "include_self"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class UpdateSplitExpense(Command[None]):
    """Update a split expense; financial edits are refused once locked by a later settlement (D226)."""

    user_id: UserId
    split_id: SplitExpenseId
    changes: SplitExpenseChanges


def update_split_expense(ctx: Context, command: UpdateSplitExpense) -> None:
    """Apply metadata or financial updates, atomically replacing split_share rows when financial terms change."""
    split, _, _ = require_split_edit_access(ctx.session, command.split_id, command.user_id)
    changes = command.changes
    fields = changes.model_fields_set

    if "description" in fields and changes.description is not None:
        split.description = changes.description.strip()
    if "note" in fields:
        split.note = changes.note.strip() or None if changes.note is not None else None

    if not (fields & FINANCIAL_FIELDS):
        return

    existing_shares = list(
        ctx.session.exec(select(SplitShare).where(col(SplitShare.split_expense_id) == command.split_id)).all()
    )
    if is_split_locked_by_settlement(ctx.session, split, existing_shares):
        raise BusinessRuleError(translatable(SplitText.SPLIT_LOCKED_BY_SETTLEMENT))

    currency = changes.currency or split.currency
    amount_minor = parse_amount_minor(changes.amount, currency) if changes.amount is not None else split.amount_minor
    method = changes.split_method or SplitMethod(split.split_method)
    if changes.spent_on is not None:
        split.spent_on = changes.spent_on

    if split.group_id is not None:
        payer = changes.paid_by_member_id if "paid_by_member_id" in fields else split.paid_by_member_id
        member_ids = (
            changes.participant_member_ids
            if changes.participant_member_ids is not None
            else [row.member_id for row in existing_shares if row.member_id is not None]
        )
        paid_by_member, new_member_shares = resolve_group_shares(
            ctx.session,
            split.group_id,
            amount_minor=amount_minor,
            currency=currency,
            split_method=method,
            paid_by_member_id=payer,
            participant_member_ids=member_ids,
            exact_shares=changes.exact_shares or [],
        )
        split.currency = currency
        split.amount_minor = amount_minor
        split.split_method = method.value
        split.paid_by_member_id = paid_by_member
        ctx.session.exec(delete(SplitShare).where(col(SplitShare.split_expense_id) == command.split_id))
        ctx.session.flush()
        for member_id, share_minor in new_member_shares:
            ctx.session.add(
                SplitShare(
                    split_expense_id=command.split_id, member_id=member_id, contact_id=None, share_minor=share_minor
                )
            )
    else:
        payer_contact = changes.paid_by_contact_id if "paid_by_contact_id" in fields else split.paid_by_contact_id
        contact_ids = (
            changes.participant_contact_ids
            if changes.participant_contact_ids is not None
            else [row.contact_id for row in existing_shares if row.contact_id is not None]
        )
        include_self = (
            changes.include_self
            if changes.include_self is not None
            else any(row.contact_id is None for row in existing_shares)
        )
        paid_by_contact, new_direct_shares = resolve_direct_shares(
            ctx.session,
            split.owner_id,
            amount_minor=amount_minor,
            currency=currency,
            split_method=method,
            paid_by_contact_id=payer_contact,
            participant_contact_ids=contact_ids,
            include_self=include_self,
            exact_shares=changes.exact_shares or [],
        )
        split.currency = currency
        split.amount_minor = amount_minor
        split.split_method = method.value
        split.paid_by_contact_id = paid_by_contact
        ctx.session.exec(delete(SplitShare).where(col(SplitShare.split_expense_id) == command.split_id))
        ctx.session.flush()
        for contact_id, share_minor in new_direct_shares:
            ctx.session.add(
                SplitShare(
                    split_expense_id=command.split_id, member_id=None, contact_id=contact_id, share_minor=share_minor
                )
            )
    ctx.session.flush()
