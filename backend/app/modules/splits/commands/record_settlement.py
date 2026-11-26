"""RecordSettlement: record an auditable full or partial settlement repayment (splits command slice, D226)."""

from pydantic import BaseModel, ConfigDict
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError, NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.core.money import DEFAULT_CURRENCY, SupportedCurrencyCode
from app.modules.splits.domain.access import require_group_member, require_group_writable
from app.modules.splits.domain.rules import parse_amount_minor
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitGroupMember, SplitSettlement
from app.modules.splits.values import ContactId, GroupId, MemberId, SettlementNote, SplitAmount, SplitDate


# REST body for POST /splits/settlements (no owner_id; server supplies it from session, D190).
class NewSettlement(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    amount: SplitAmount
    currency: SupportedCurrencyCode = DEFAULT_CURRENCY
    settled_on: SplitDate
    note: SettlementNote | None = None
    group_id: GroupId | None = None
    # Group mode: both from_member_id and to_member_id must be active members of group_id.
    from_member_id: MemberId | None = None
    to_member_id: MemberId | None = None
    # Direct mode: exactly one of from_contact_id / to_contact_id is a contact, the other is None (You).
    from_contact_id: ContactId | None = None
    to_contact_id: ContactId | None = None


class RecordSettlement(Command[int]):
    """Record a direct or group settlement repayment, returning its new id."""

    owner_id: UserId
    settlement: NewSettlement


def record_settlement(ctx: Context, command: RecordSettlement) -> int:
    """Validate parties, currency precision, and permissions, then stage a new SplitSettlement row."""
    body = command.settlement
    amount_minor = parse_amount_minor(body.amount, body.currency)
    note = body.note.strip() if body.note else None
    now = ctx.clock.now()

    if body.group_id is not None:
        group, _ = require_group_member(ctx.session, body.group_id, command.owner_id)
        require_group_writable(group)
        if body.from_contact_id is not None or body.to_contact_id is not None:
            raise BusinessRuleError(translatable(SplitText.SETTLEMENT_SAME_PARTY))
        if body.from_member_id is None or body.to_member_id is None:
            raise NotFoundError(translatable(SplitText.MEMBER_NOT_FOUND))
        if body.from_member_id == body.to_member_id:
            raise BusinessRuleError(translatable(SplitText.SETTLEMENT_SAME_PARTY))

        active_ids = set(
            ctx.session.exec(
                select(SplitGroupMember.id).where(
                    col(SplitGroupMember.group_id) == body.group_id,
                    col(SplitGroupMember.id).in_([body.from_member_id, body.to_member_id]),
                    col(SplitGroupMember.left_at).is_(None),
                )
            ).all()
        )
        if len(active_ids) != 2:
            raise NotFoundError(translatable(SplitText.MEMBER_NOT_FOUND))

        row = SplitSettlement(
            owner_id=command.owner_id,
            group_id=body.group_id,
            from_member_id=body.from_member_id,
            to_member_id=body.to_member_id,
            from_contact_id=None,
            to_contact_id=None,
            amount_minor=amount_minor,
            currency=body.currency,
            settled_on=body.settled_on,
            note=note or None,
            voided_at=None,
            voided_by_user_id=None,
            created_at=now,
        )
    else:
        if body.from_member_id is not None or body.to_member_id is not None:
            raise BusinessRuleError(translatable(SplitText.SETTLEMENT_SAME_PARTY))
        # Direct settlements must always be between the owner (None) and exactly one owned contact.
        if (body.from_contact_id is None) == (body.to_contact_id is None):
            raise BusinessRuleError(translatable(SplitText.SETTLEMENT_SAME_PARTY))
        contact_id = body.from_contact_id if body.from_contact_id is not None else body.to_contact_id
        assert contact_id is not None
        repository.get_contact(ctx.session, command.owner_id, contact_id)

        row = SplitSettlement(
            owner_id=command.owner_id,
            group_id=None,
            from_member_id=None,
            to_member_id=None,
            from_contact_id=body.from_contact_id,
            to_contact_id=body.to_contact_id,
            amount_minor=amount_minor,
            currency=body.currency,
            settled_on=body.settled_on,
            note=note or None,
            voided_at=None,
            voided_by_user_id=None,
            created_at=now,
        )

    ctx.session.add(row)
    ctx.session.flush()
    assert row.id is not None
    return row.id
