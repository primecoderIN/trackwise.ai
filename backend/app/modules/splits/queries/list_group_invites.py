"""ListGroupInvites: list invite audit records for a Shared group's owner (splits query slice)."""

from sqlmodel import col, desc, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_owner, require_shared_group
from app.modules.splits.models import InviteRead
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitGroupInvite, SplitGroupMember
from app.modules.splits.values import GroupId


class ListGroupInvites(Query[list[InviteRead]]):
    """List invites created for `group_id` (owner-only; never includes raw tokens)."""

    owner_id: UserId
    group_id: GroupId


def list_group_invites(ctx: Context, query: ListGroupInvites) -> list[InviteRead]:
    """Return every invite row for `group_id`, newest first."""
    group, _ = require_group_owner(ctx.session, query.group_id, query.owner_id)
    require_shared_group(group)

    members = ctx.session.exec(select(SplitGroupMember).where(col(SplitGroupMember.group_id) == query.group_id)).all()
    names = {m.id: m.display_name for m in members if m.id is not None}

    now = ctx.clock.now()
    rows = ctx.session.exec(
        select(SplitGroupInvite)
        .where(col(SplitGroupInvite.group_id) == query.group_id)
        .order_by(desc(col(SplitGroupInvite.created_at)), desc(col(SplitGroupInvite.id)))
    ).all()
    return [
        InviteRead(
            id=row.id,
            hint=row.hint,
            target_member_id=row.target_member_id,
            target_member_name=names.get(row.target_member_id) if row.target_member_id else None,
            max_uses=row.max_uses,
            use_count=row.use_count,
            expires_at=repository.utc(row.expires_at),
            revoked_at=repository.utc(row.revoked_at) if row.revoked_at is not None else None,
            created_at=repository.utc(row.created_at),
            active=(row.revoked_at is None and repository.utc(row.expires_at) > now and row.use_count < row.max_uses),
        )
        for row in rows
        if row.id is not None
    ]
