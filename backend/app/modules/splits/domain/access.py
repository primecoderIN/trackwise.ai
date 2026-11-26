"""Centralized authorization and ledger-lock checks for the splits module (splits domain, D190, D226).

Every handler delegates resource authorization here so rules for all five identities (Group Owner, Split/Settlement
Creator, Other Active Member, Former Member, Outsider) are enforced consistently in one place:
- Non-members and former members (`left_at IS NOT NULL`) always receive 404 NotFoundError (zero BOLA leak).
- Active members attempting owner/creator-only mutations receive 403 ForbiddenError.
- Archived groups are read-only (422 on mutations).
- Splits locked by a subsequent non-voided settlement reject financial edits and deletes (422).
"""

from collections.abc import Sequence

from sqlmodel import Session, col, or_, select

from app.core.errors import BusinessRuleError, ForbiddenError, NotFoundError
from app.core.i18n import translatable
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import (
    SplitExpense,
    SplitGroup,
    SplitGroupMember,
    SplitSettlement,
    SplitShare,
)
from app.modules.splits.values import GroupKind, MemberRole


def require_group_member(session: Session, group_id: int, user_id: int) -> tuple[SplitGroup, SplitGroupMember]:
    """Return `(group, active_member)` if `user_id` may access `group_id`; else raise 404 NotFoundError."""
    row = session.exec(
        select(SplitGroup, SplitGroupMember)
        .join(SplitGroupMember, col(SplitGroupMember.group_id) == col(SplitGroup.id))
        .where(
            col(SplitGroup.id) == group_id,
            col(SplitGroupMember.user_id) == user_id,
            col(SplitGroupMember.left_at).is_(None),
        )
    ).first()
    if row is None:
        raise NotFoundError(translatable(SplitText.GROUP_NOT_FOUND))
    group, member = row
    # Personal groups are strictly accessible only to their single owner (D190).
    if group.kind == GroupKind.PERSONAL.value and group.owner_id != user_id:
        raise NotFoundError(translatable(SplitText.GROUP_NOT_FOUND))
    return group, member


def require_group_owner(session: Session, group_id: int, user_id: int) -> tuple[SplitGroup, SplitGroupMember]:
    """Require `user_id` to be the active owner of `group_id` (404 for outsiders/former members, 403 for members)."""
    group, member = require_group_member(session, group_id, user_id)
    if group.owner_id != user_id or member.role != MemberRole.OWNER.value:
        raise ForbiddenError(translatable(SplitText.GROUP_OWNER_REQUIRED))
    return group, member


def require_group_writable(group: SplitGroup) -> None:
    """Refuse mutations on archived groups (archived groups remain readable for history, D226)."""
    if group.archived_at is not None:
        raise BusinessRuleError(translatable(SplitText.GROUP_ARCHIVED))


def require_shared_group(group: SplitGroup) -> None:
    """Refuse invite or multi-user actions on a Personal group."""
    if group.kind != GroupKind.SHARED.value:
        raise BusinessRuleError(translatable(SplitText.GROUP_NOT_SHARED))


def require_split_access(
    session: Session, split_id: int, user_id: int
) -> tuple[SplitExpense, SplitGroup | None, SplitGroupMember | None]:
    """Authorize reading `split_id`: owner-only for direct splits, active-member check for group splits."""
    split = session.exec(select(SplitExpense).where(col(SplitExpense.id) == split_id)).first()
    if split is None:
        raise NotFoundError(translatable(SplitText.SPLIT_NOT_FOUND))
    if split.group_id is None:
        if split.owner_id != user_id:
            raise NotFoundError(translatable(SplitText.SPLIT_NOT_FOUND))
        return split, None, None
    try:
        group, member = require_group_member(session, split.group_id, user_id)
    except NotFoundError as exc:
        raise NotFoundError(translatable(SplitText.SPLIT_NOT_FOUND)) from exc
    return split, group, member


def can_edit_split(split: SplitExpense, group: SplitGroup | None, user_id: int) -> bool:
    """Whether `user_id` may edit or delete `split` (creator or group owner, D226)."""
    if split.group_id is None:
        return split.owner_id == user_id
    return split.owner_id == user_id or (group is not None and group.owner_id == user_id)


def require_split_edit_access(
    session: Session, split_id: int, user_id: int
) -> tuple[SplitExpense, SplitGroup | None, SplitGroupMember | None]:
    """Authorize editing/deleting `split_id`: 404 for non-members/former members, 403 for non-creator members."""
    split, group, member = require_split_access(session, split_id, user_id)
    if group is not None:
        require_group_writable(group)
    if not can_edit_split(split, group, user_id):
        raise ForbiddenError(translatable(SplitText.SPLIT_EDIT_FORBIDDEN))
    return split, group, member


def can_void_settlement(settlement: SplitSettlement, group: SplitGroup | None, user_id: int) -> bool:
    """Whether `user_id` may void `settlement` (creator or group owner, D226)."""
    if settlement.group_id is None:
        return settlement.owner_id == user_id
    return settlement.owner_id == user_id or (group is not None and group.owner_id == user_id)


def require_settlement_void_access(
    session: Session, settlement_id: int, user_id: int
) -> tuple[SplitSettlement, SplitGroup | None]:
    """Authorize soft-voiding `settlement_id`: 404 for outsiders/former members, 403 for non-creator members."""
    settlement = session.exec(select(SplitSettlement).where(col(SplitSettlement.id) == settlement_id)).first()
    if settlement is None:
        raise NotFoundError(translatable(SplitText.SETTLEMENT_NOT_FOUND))
    if settlement.group_id is None:
        if settlement.owner_id != user_id:
            raise NotFoundError(translatable(SplitText.SETTLEMENT_NOT_FOUND))
        return settlement, None
    try:
        group, _ = require_group_member(session, settlement.group_id, user_id)
    except NotFoundError as exc:
        raise NotFoundError(translatable(SplitText.SETTLEMENT_NOT_FOUND)) from exc
    require_group_writable(group)
    if not can_void_settlement(settlement, group, user_id):
        raise ForbiddenError(translatable(SplitText.SETTLEMENT_VOID_FORBIDDEN))
    return settlement, group


def is_split_locked_by_settlement(
    session: Session,
    split: SplitExpense,
    shares: Sequence[SplitShare],
) -> bool:
    """True if a non-voided settlement exists on or after `split.created_at` in the same currency involving any
    participant of `split` (prevents retroactive financial edits after settlement, D226)."""
    if split.group_id is not None:
        member_ids = {s.member_id for s in shares if s.member_id is not None}
        if split.paid_by_member_id is not None:
            member_ids.add(split.paid_by_member_id)
        if not member_ids:
            return False
        hit = session.exec(
            select(SplitSettlement.id).where(
                col(SplitSettlement.group_id) == split.group_id,
                col(SplitSettlement.currency) == split.currency,
                col(SplitSettlement.voided_at).is_(None),
                col(SplitSettlement.created_at) >= split.created_at,
                or_(
                    col(SplitSettlement.from_member_id).in_(member_ids),
                    col(SplitSettlement.to_member_id).in_(member_ids),
                ),
            )
        ).first()
        return hit is not None

    contact_ids = {s.contact_id for s in shares if s.contact_id is not None}
    if split.paid_by_contact_id is not None:
        contact_ids.add(split.paid_by_contact_id)
    if not contact_ids:
        return False
    hit = session.exec(
        select(SplitSettlement.id).where(
            col(SplitSettlement.owner_id) == split.owner_id,
            col(SplitSettlement.group_id).is_(None),
            col(SplitSettlement.currency) == split.currency,
            col(SplitSettlement.voided_at).is_(None),
            col(SplitSettlement.created_at) >= split.created_at,
            or_(
                col(SplitSettlement.from_contact_id).in_(contact_ids),
                col(SplitSettlement.to_contact_id).in_(contact_ids),
            ),
        )
    ).first()
    return hit is not None
