"""GetSplitExpense: fetch one direct or group split expense authorized for the caller (splits query slice)."""

from sqlmodel import col, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.domain.access import require_split_access
from app.modules.splits.ledger_models import SplitExpenseRead
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitContact, SplitGroupMember, SplitShare
from app.modules.splits.queries.read_helpers import build_split_read
from app.modules.splits.values import SplitExpenseId


class GetSplitExpense(Query[SplitExpenseRead]):
    """Read one split expense visible to `user_id` (404 if missing or unauthorized)."""

    user_id: UserId
    split_id: SplitExpenseId


def get_split_expense(ctx: Context, query: GetSplitExpense) -> SplitExpenseRead:
    """Authorize and project `split_id`, attaching only `user_id`'s private expense link."""
    split, group, my_member = require_split_access(ctx.session, query.split_id, query.user_id)
    shares = list(ctx.session.exec(select(SplitShare).where(col(SplitShare.split_expense_id) == query.split_id)).all())
    my_link = repository.get_expense_link(ctx.session, query.split_id, query.user_id)

    members_by_id: dict[int, SplitGroupMember] = {}
    contacts_by_id: dict[int, SplitContact] = {}
    if split.group_id is not None:
        members = ctx.session.exec(
            select(SplitGroupMember).where(col(SplitGroupMember.group_id) == split.group_id)
        ).all()
        members_by_id = {m.id: m for m in members if m.id is not None}
    else:
        cids = [s.contact_id for s in shares if s.contact_id is not None]
        if split.paid_by_contact_id is not None:
            cids.append(split.paid_by_contact_id)
        contacts_by_id = repository.get_contacts_by_ids(ctx.session, query.user_id, cids)

    return build_split_read(
        ctx.session,
        split,
        viewer_id=query.user_id,
        group=group,
        my_member=my_member,
        members_by_id=members_by_id,
        contacts_by_id=contacts_by_id,
        shares=shares,
        my_link=my_link,
    )
