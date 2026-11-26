"""Write-side and shared query helpers for the splits tables (splits persistence).

Stages changes only (never commits: the MessageBus owns the unit of work). Every lookup filters explicitly on
owner_id or group_id — never reading a row by id alone (D190, check_rules scan 9).
"""

from collections.abc import Sequence
from datetime import datetime

from sqlmodel import Session, col, or_, select

from app.core.clock import as_utc
from app.core.errors import NotFoundError
from app.core.i18n import translatable
from app.modules.splits.domain.balances import LedgerExpense, LedgerSettlement
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import (
    SplitContact,
    SplitExpense,
    SplitExpenseLink,
    SplitGroupMember,
    SplitProfile,
    SplitSettlement,
    SplitShare,
)


def utc(moment: datetime) -> datetime:
    """Normalize a stored timestamp to timezone-aware UTC (SQLite drops tzinfo on read)."""
    return as_utc(moment)


def get_contact(session: Session, owner_id: int, contact_id: int) -> SplitContact:
    """Fetch one of `owner_id`'s contacts, raising 404 if missing or owned by someone else."""
    contact = session.exec(
        select(SplitContact).where(col(SplitContact.id) == contact_id, col(SplitContact.owner_id) == owner_id)
    ).first()
    if contact is None:
        raise NotFoundError(translatable(SplitText.CONTACT_NOT_FOUND))
    return contact


def get_contacts_by_ids(session: Session, owner_id: int, contact_ids: Sequence[int]) -> dict[int, SplitContact]:
    """Fetch all matching `owner_id` contacts by id."""
    if not contact_ids:
        return {}
    rows = session.exec(
        select(SplitContact).where(col(SplitContact.owner_id) == owner_id, col(SplitContact.id).in_(contact_ids))
    ).all()
    return {row.id: row for row in rows if row.id is not None}


def contact_is_referenced(session: Session, owner_id: int, contact_id: int) -> bool:
    """True if `contact_id` appears in any group membership, direct split, share, or settlement."""
    if session.exec(select(SplitGroupMember.id).where(col(SplitGroupMember.contact_id) == contact_id)).first():
        return True
    if session.exec(
        select(SplitExpense.id).where(
            col(SplitExpense.owner_id) == owner_id, col(SplitExpense.paid_by_contact_id) == contact_id
        )
    ).first():
        return True
    if session.exec(select(SplitShare.id).where(col(SplitShare.contact_id) == contact_id)).first():
        return True
    return (
        session.exec(
            select(SplitSettlement.id).where(
                col(SplitSettlement.owner_id) == owner_id,
                or_(
                    col(SplitSettlement.from_contact_id) == contact_id,
                    col(SplitSettlement.to_contact_id) == contact_id,
                ),
            )
        ).first()
        is not None
    )


def group_has_transactions(session: Session, group_id: int) -> bool:
    """True if `group_id` has any split expense or settlement (used to enforce archive-instead-of-delete)."""
    if session.exec(select(SplitExpense.id).where(col(SplitExpense.group_id) == group_id)).first():
        return True
    return session.exec(select(SplitSettlement.id).where(col(SplitSettlement.group_id) == group_id)).first() is not None


def member_has_history(session: Session, member_id: int) -> bool:
    """True if `member_id` is referenced by any split expense, share, or settlement."""
    if session.exec(select(SplitExpense.id).where(col(SplitExpense.paid_by_member_id) == member_id)).first():
        return True
    if session.exec(select(SplitShare.id).where(col(SplitShare.member_id) == member_id)).first():
        return True
    return (
        session.exec(
            select(SplitSettlement.id).where(
                or_(
                    col(SplitSettlement.from_member_id) == member_id,
                    col(SplitSettlement.to_member_id) == member_id,
                )
            )
        ).first()
        is not None
    )


def load_group_ledger(session: Session, group_id: int) -> tuple[list[LedgerExpense], list[LedgerSettlement]]:
    """Load minimal expense and settlement projections for `group_id`'s balance math."""
    expenses = session.exec(select(SplitExpense).where(col(SplitExpense.group_id) == group_id)).all()
    expense_ids = [exp.id for exp in expenses if exp.id is not None]
    shares_by_expense: dict[int, list[tuple[int | None, int]]] = {}
    if expense_ids:
        for share in session.exec(select(SplitShare).where(col(SplitShare.split_expense_id).in_(expense_ids))).all():
            shares_by_expense.setdefault(share.split_expense_id, []).append((share.member_id, share.share_minor))
    ledger_expenses = [
        LedgerExpense(
            currency=exp.currency,
            paid_by=exp.paid_by_member_id,
            shares=tuple(shares_by_expense.get(exp.id, ())),
        )
        for exp in expenses
        if exp.id is not None
    ]
    settlements = session.exec(select(SplitSettlement).where(col(SplitSettlement.group_id) == group_id)).all()
    ledger_settlements = [
        LedgerSettlement(
            currency=row.currency,
            from_party=row.from_member_id,
            to_party=row.to_member_id,
            amount_minor=row.amount_minor,
            voided=row.voided_at is not None,
        )
        for row in settlements
    ]
    return ledger_expenses, ledger_settlements


def get_profile(session: Session, owner_id: int) -> SplitProfile | None:
    """Fetch `owner_id`'s receive-UPI profile if one has been saved."""
    return session.exec(select(SplitProfile).where(col(SplitProfile.owner_id) == owner_id)).first()


def shared_upi_by_user(session: Session, user_ids: Sequence[int]) -> dict[int, str]:
    """Return `{user_id: upi_id}` ONLY for users who explicitly opted into `share_upi_with_groups = True`."""
    if not user_ids:
        return {}
    rows = session.exec(
        select(SplitProfile).where(
            col(SplitProfile.owner_id).in_(user_ids),
            col(SplitProfile.share_upi_with_groups).is_(True),
            col(SplitProfile.upi_id).is_not(None),
        )
    ).all()
    return {row.owner_id: row.upi_id for row in rows if row.upi_id is not None}


def get_expense_link(session: Session, split_expense_id: int, owner_id: int) -> SplitExpenseLink | None:
    """Fetch the caller's own private expense link for `split_expense_id`, if any."""
    return session.exec(
        select(SplitExpenseLink).where(
            col(SplitExpenseLink.split_expense_id) == split_expense_id,
            col(SplitExpenseLink.owner_id) == owner_id,
        )
    ).first()
