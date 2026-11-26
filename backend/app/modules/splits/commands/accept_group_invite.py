"""AcceptGroupInvite: atomic, idempotent invite consumption, guest-seat claiming, and rejoin restoration (D226).

All checks, invite `use_count` increment, and membership creation/reactivation/seat-claiming execute in ONE
MessageBus transaction using conditional SQL UPDATEs (`rows_affected`) so concurrent requests can never exceed
`max_uses` or double-claim a guest seat.
"""

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError, NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.core.sql import rows_affected
from app.modules.splits.domain.rules import resolve_display_name
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitGroup, SplitGroupInvite, SplitGroupMember
from app.modules.splits.values import (
    INVITE_TOKEN_HASH_LENGTH,
    GroupKind,
    InviteTokenInput,
    MemberId,
    MemberRole,
)


# REST body for POST /splits/invites/accept (token stays in JSON body, never query string).
class AcceptInviteInput(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    token: InviteTokenInput
    claim_member_id: MemberId | None = None


class AcceptGroupInvite(Command[int]):
    """Atomically accept a hashed invite for `user_id`, returning `group_id`."""

    user_id: UserId
    user_name: str | None = None
    token_hash: str = Field(min_length=INVITE_TOKEN_HASH_LENGTH, max_length=INVITE_TOKEN_HASH_LENGTH)
    claim_member_id: MemberId | None = None


def accept_group_invite(ctx: Context, command: AcceptGroupInvite) -> int:
    """Validate and atomically consume an invite, supporting idempotent retries, rejoins, and guest-seat claims."""
    row = ctx.session.exec(
        select(SplitGroupInvite, SplitGroup)
        .join(SplitGroup, col(SplitGroup.id) == col(SplitGroupInvite.group_id))
        .where(col(SplitGroupInvite.token_hash) == command.token_hash)
    ).first()
    if row is None:
        raise NotFoundError(translatable(SplitText.INVITE_INVALID))
    invite, group = row
    if group.kind != GroupKind.SHARED.value or group.archived_at is not None or invite.id is None:
        raise NotFoundError(translatable(SplitText.INVITE_INVALID))

    existing = ctx.session.exec(
        select(SplitGroupMember).where(
            col(SplitGroupMember.group_id) == invite.group_id,
            col(SplitGroupMember.user_id) == command.user_id,
        )
    ).first()
    # Idempotency (D226): an already-active member retrying the invite gets group_id without burning another use.
    if existing is not None and existing.left_at is None:
        return invite.group_id

    seat_id = invite.target_member_id if invite.target_member_id is not None else command.claim_member_id
    if (
        invite.target_member_id is not None
        and command.claim_member_id is not None
        and command.claim_member_id != invite.target_member_id
    ):
        raise BusinessRuleError(translatable(SplitText.SEAT_ALREADY_CLAIMED))
    if existing is not None and seat_id is not None:
        raise BusinessRuleError(translatable(SplitText.REJOIN_CANNOT_CLAIM_SEAT))

    now = ctx.clock.now()
    # Atomic conditional UPDATE guarantees concurrent acceptors can never exceed max_uses.
    consumed = rows_affected(
        ctx.session,
        update(SplitGroupInvite)
        .where(
            col(SplitGroupInvite.id) == invite.id,
            col(SplitGroupInvite.revoked_at).is_(None),
            col(SplitGroupInvite.expires_at) > now,
            col(SplitGroupInvite.use_count) < col(SplitGroupInvite.max_uses),
        )
        .values(use_count=col(SplitGroupInvite.use_count) + 1)
        .execution_options(synchronize_session=False),
    )
    if consumed != 1:
        raise NotFoundError(translatable(SplitText.INVITE_INVALID))

    display_name = resolve_display_name(command.user_name)
    if existing is not None:
        # Membership restoration (D226): reactivate the user's original member row to preserve split history.
        reactivated = rows_affected(
            ctx.session,
            update(SplitGroupMember)
            .where(col(SplitGroupMember.id) == existing.id, col(SplitGroupMember.left_at).is_not(None))
            .values(left_at=None, display_name=display_name)
            .execution_options(synchronize_session=False),
        )
        if reactivated != 1:
            return invite.group_id
        return invite.group_id

    if seat_id is not None:
        # Atomic conditional UPDATE guarantees two concurrent users can never claim the same guest seat.
        claimed = rows_affected(
            ctx.session,
            update(SplitGroupMember)
            .where(
                col(SplitGroupMember.id) == seat_id,
                col(SplitGroupMember.group_id) == invite.group_id,
                col(SplitGroupMember.user_id).is_(None),
                col(SplitGroupMember.left_at).is_(None),
            )
            .values(user_id=command.user_id, contact_id=None, display_name=display_name, joined_at=now)
            .execution_options(synchronize_session=False),
        )
        if claimed != 1:
            raise BusinessRuleError(translatable(SplitText.SEAT_ALREADY_CLAIMED))
        return invite.group_id

    ctx.session.add(
        SplitGroupMember(
            group_id=invite.group_id,
            user_id=command.user_id,
            contact_id=None,
            display_name=display_name,
            role=MemberRole.MEMBER.value,
            added_by_user_id=invite.created_by_user_id,
            joined_at=now,
            left_at=None,
        )
    )
    try:
        ctx.session.flush()
    except IntegrityError as exc:
        raise BusinessRuleError(translatable(SplitText.SEAT_ALREADY_CLAIMED)) from exc
    return invite.group_id
