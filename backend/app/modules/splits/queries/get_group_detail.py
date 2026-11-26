"""GetGroupDetail: complete view of one Personal or Shared group (splits query slice)."""

from sqlmodel import col, desc, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_member
from app.modules.splits.ledger_models import GroupDetailRead
from app.modules.splits.models import InviteRead
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import (
    SplitExpense,
    SplitExpenseLink,
    SplitGroupInvite,
    SplitSettlement,
    SplitShare,
)
from app.modules.splits.queries.read_helpers import (
    build_group_balances_and_transfers,
    build_group_members,
    build_group_summary,
    build_settlement_read,
    build_split_read,
    load_group_snapshot_and_members,
    member_upi_map,
)
from app.modules.splits.values import GroupId, GroupKind, MemberRole


class GetGroupDetail(Query[GroupDetailRead]):
    """Read full details, simplified transfers, invites (for owner), splits, and settlements for `group_id`."""

    user_id: UserId
    group_id: GroupId


def get_group_detail(ctx: Context, query: GetGroupDetail) -> GroupDetailRead:
    """Authorize membership and assemble the complete group ledger view."""
    group, my_member = require_group_member(ctx.session, query.group_id, query.user_id)
    members, snapshot = load_group_snapshot_and_members(ctx.session, query.group_id)
    members_by_id = {m.id: m for m in members if m.id is not None}
    upis = member_upi_map(ctx.session, group, members, query.user_id)

    summary = build_group_summary(group, my_member, members, snapshot)
    member_reads = build_group_members(members, query.user_id, upis)
    member_balances, transfers = build_group_balances_and_transfers(snapshot, members_by_id, query.user_id, upis)

    # Active invites are visible only to the Shared group's owner.
    invites: list[InviteRead] = []
    if group.kind == GroupKind.SHARED.value and my_member.role == MemberRole.OWNER.value:
        now = ctx.clock.now()
        rows = ctx.session.exec(
            select(SplitGroupInvite)
            .where(col(SplitGroupInvite.group_id) == query.group_id)
            .order_by(desc(col(SplitGroupInvite.created_at)))
        ).all()
        for row in rows:
            if row.id is None:
                continue
            target = members_by_id.get(row.target_member_id) if row.target_member_id else None
            expires_at = repository.utc(row.expires_at)
            is_active = row.revoked_at is None and expires_at > now and row.use_count < row.max_uses
            invites.append(
                InviteRead(
                    id=row.id,
                    hint=row.hint,
                    target_member_id=row.target_member_id,
                    target_member_name=target.display_name if target else None,
                    max_uses=row.max_uses,
                    use_count=row.use_count,
                    expires_at=expires_at,
                    revoked_at=repository.utc(row.revoked_at) if row.revoked_at is not None else None,
                    created_at=repository.utc(row.created_at),
                    active=is_active,
                )
            )

    expense_rows = list(
        ctx.session.exec(
            select(SplitExpense)
            .where(col(SplitExpense.group_id) == query.group_id)
            .order_by(desc(col(SplitExpense.spent_on)), desc(col(SplitExpense.id)))
        ).all()
    )
    split_ids = [row.id for row in expense_rows if row.id is not None]
    shares_by_split: dict[int, list[SplitShare]] = {}
    link_by_split: dict[int, SplitExpenseLink] = {}
    if split_ids:
        for share in ctx.session.exec(select(SplitShare).where(col(SplitShare.split_expense_id).in_(split_ids))).all():
            shares_by_split.setdefault(share.split_expense_id, []).append(share)
        for link in ctx.session.exec(
            select(SplitExpenseLink).where(
                col(SplitExpenseLink.owner_id) == query.user_id,
                col(SplitExpenseLink.split_expense_id).in_(split_ids),
            )
        ).all():
            link_by_split[link.split_expense_id] = link

    split_reads = [
        build_split_read(
            ctx.session,
            row,
            viewer_id=query.user_id,
            group=group,
            my_member=my_member,
            members_by_id=members_by_id,
            contacts_by_id={},
            shares=shares_by_split.get(row.id, ()),
            my_link=link_by_split.get(row.id),
        )
        for row in expense_rows
        if row.id is not None
    ]

    settlement_rows = ctx.session.exec(
        select(SplitSettlement)
        .where(col(SplitSettlement.group_id) == query.group_id)
        .order_by(desc(col(SplitSettlement.settled_on)), desc(col(SplitSettlement.id)))
    ).all()
    settlement_reads = [
        build_settlement_read(row, viewer_id=query.user_id, group=group, members_by_id=members_by_id, contacts_by_id={})
        for row in settlement_rows
    ]

    return GroupDetailRead(
        group=summary,
        members=member_reads,
        member_balances=member_balances,
        simplified_transfers=transfers,
        invites=invites,
        splits=split_reads,
        settlements=settlement_reads,
    )
