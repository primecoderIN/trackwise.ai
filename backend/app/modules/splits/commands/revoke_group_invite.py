"""RevokeGroupInvite: soft-revoke an invite link while retaining its audit record (splits command slice, D226)."""

from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_owner
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitGroupInvite
from app.modules.splits.values import GroupId, InviteId


class RevokeGroupInvite(Command[None]):
    """Revoke one invite belonging to `group_id` (owner-only)."""

    owner_id: UserId
    group_id: GroupId
    invite_id: InviteId


def revoke_group_invite(ctx: Context, command: RevokeGroupInvite) -> None:
    """Mark `revoked_at` on the invite (idempotent if already revoked)."""
    require_group_owner(ctx.session, command.group_id, command.owner_id)
    invite = ctx.session.exec(
        select(SplitGroupInvite).where(
            col(SplitGroupInvite.id) == command.invite_id,
            col(SplitGroupInvite.group_id) == command.group_id,
        )
    ).first()
    if invite is None:
        raise NotFoundError(translatable(SplitText.INVITE_NOT_FOUND))
    if invite.revoked_at is None:
        invite.revoked_at = ctx.clock.now()
        ctx.session.flush()
