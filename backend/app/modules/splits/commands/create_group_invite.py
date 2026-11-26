"""CreateGroupInvite: persist a pre-hashed invite link for a Shared group (splits command slice, D226)."""

from datetime import timedelta

from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError, NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_owner, require_group_writable, require_shared_group
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitGroupInvite, SplitGroupMember
from app.modules.splits.values import (
    DEFAULT_INVITE_LIFETIME,
    INVITE_HINT_LENGTH,
    INVITE_TOKEN_HASH_LENGTH,
    MAX_ACTIVE_INVITES,
    MAX_INVITE_USES,
    GroupId,
    InviteLifetime,
    MemberId,
)


# REST body for POST /splits/groups/{group_id}/invites.
class NewGroupInvite(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    target_member_id: MemberId | None = None
    lifetime_days: InviteLifetime = DEFAULT_INVITE_LIFETIME
    max_uses: int = Field(default=1, ge=1, le=MAX_INVITE_USES)


class CreateGroupInvite(Command[int]):
    """Store a SHA-256 hashed invite row for a Shared group (called by GroupInvites); returns invite id."""

    owner_id: UserId
    group_id: GroupId
    invite: NewGroupInvite
    token_hash: str = Field(min_length=INVITE_TOKEN_HASH_LENGTH, max_length=INVITE_TOKEN_HASH_LENGTH)
    hint: str = Field(min_length=INVITE_HINT_LENGTH, max_length=INVITE_HINT_LENGTH)


def create_group_invite(ctx: Context, command: CreateGroupInvite) -> int:
    """Validate owner permissions, active invite cap, and optional guest seat target, then stage invite row."""
    group, _ = require_group_owner(ctx.session, command.group_id, command.owner_id)
    require_group_writable(group)
    require_shared_group(group)

    now = ctx.clock.now()
    active_invites = ctx.session.exec(
        select(SplitGroupInvite.id).where(
            col(SplitGroupInvite.group_id) == command.group_id,
            col(SplitGroupInvite.revoked_at).is_(None),
            col(SplitGroupInvite.expires_at) > now,
            col(SplitGroupInvite.use_count) < col(SplitGroupInvite.max_uses),
        )
    ).all()
    if len(active_invites) >= MAX_ACTIVE_INVITES:
        raise BusinessRuleError(translatable(SplitText.INVITE_LIMIT_REACHED, limit=MAX_ACTIVE_INVITES))

    target_id = command.invite.target_member_id
    max_uses = command.invite.max_uses
    if target_id is not None:
        target = ctx.session.exec(
            select(SplitGroupMember).where(
                col(SplitGroupMember.id) == target_id,
                col(SplitGroupMember.group_id) == command.group_id,
                col(SplitGroupMember.left_at).is_(None),
            )
        ).first()
        if target is None:
            raise NotFoundError(translatable(SplitText.MEMBER_NOT_FOUND))
        if target.user_id is not None:
            raise BusinessRuleError(translatable(SplitText.SEAT_ALREADY_CLAIMED))
        # A seat-specific invite can only ever be claimed once.
        max_uses = 1

    row = SplitGroupInvite(
        group_id=command.group_id,
        created_by_user_id=command.owner_id,
        token_hash=command.token_hash,
        hint=command.hint,
        target_member_id=target_id,
        max_uses=max_uses,
        use_count=0,
        expires_at=now + timedelta(days=int(command.invite.lifetime_days)),
        revoked_at=None,
        created_at=now,
    )
    ctx.session.add(row)
    ctx.session.flush()
    assert row.id is not None
    return row.id
