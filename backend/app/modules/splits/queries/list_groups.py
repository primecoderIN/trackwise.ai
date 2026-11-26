"""ListGroups: list Personal and Shared groups the signed-in user actively belongs to (splits query slice)."""

from sqlmodel import col, desc, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.models import GroupSummaryRead
from app.modules.splits.persistence.tables import SplitGroup, SplitGroupMember
from app.modules.splits.queries.read_helpers import build_group_summary, load_group_snapshot_and_members
from app.modules.splits.values import GroupKind


class ListGroups(Query[list[GroupSummaryRead]]):
    """List groups where `user_id` is an active member, optionally including archived groups."""

    user_id: UserId
    include_archived: bool = False


def list_groups(ctx: Context, query: ListGroups) -> list[GroupSummaryRead]:
    """Return every active group for `user_id` with per-currency net balances inside each group."""
    stmt = (
        select(SplitGroup, SplitGroupMember)
        .join(SplitGroupMember, col(SplitGroupMember.group_id) == col(SplitGroup.id))
        .where(
            col(SplitGroupMember.user_id) == query.user_id,
            col(SplitGroupMember.left_at).is_(None),
        )
        .order_by(desc(col(SplitGroup.created_at)), desc(col(SplitGroup.id)))
    )
    if not query.include_archived:
        stmt = stmt.where(col(SplitGroup.archived_at).is_(None))

    summaries: list[GroupSummaryRead] = []
    for group, my_member in ctx.session.exec(stmt).all():
        if group.id is None:
            continue
        if group.kind == GroupKind.PERSONAL.value and group.owner_id != query.user_id:
            continue
        members, snapshot = load_group_snapshot_and_members(ctx.session, group.id)
        summaries.append(build_group_summary(group, my_member, members, snapshot))
    return summaries
