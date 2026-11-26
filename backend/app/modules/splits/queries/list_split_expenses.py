"""ListSplitExpenses: list direct and group split expenses visible to the caller (splits query slice)."""

from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import col, desc, or_, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.core.money import SupportedCurrencyCode
from app.modules.splits.domain.access import require_group_member
from app.modules.splits.ledger_models import SplitExpenseList
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import (
    SplitExpense,
    SplitExpenseLink,
    SplitGroup,
    SplitGroupMember,
    SplitShare,
)
from app.modules.splits.queries.read_helpers import build_split_read
from app.modules.splits.values import DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT, ContactId, GroupId


# Query parameters for GET /splits (extra="forbid" rejects unknown query parameters with 422).
class SplitExpenseFilters(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    group_id: GroupId | None = None
    contact_id: ContactId | None = None
    currency: SupportedCurrencyCode | None = None
    limit: int = Field(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT)
    offset: int = Field(default=0, ge=0)


class ListSplitExpenses(Query[SplitExpenseList]):
    """List split expenses accessible to `user_id`, newest first."""

    user_id: UserId
    filters: SplitExpenseFilters = Field(default_factory=SplitExpenseFilters)


def list_split_expenses(ctx: Context, query: ListSplitExpenses) -> SplitExpenseList:
    """Return authorized split expenses matching `filters`, carrying only `user_id`'s private links."""
    filters = query.filters
    active_memberships = ctx.session.exec(
        select(SplitGroupMember).where(
            col(SplitGroupMember.user_id) == query.user_id,
            col(SplitGroupMember.left_at).is_(None),
        )
    ).all()
    my_member_by_group = {m.group_id: m for m in active_memberships}

    if filters.group_id is not None:
        require_group_member(ctx.session, filters.group_id, query.user_id)
        stmt = select(SplitExpense).where(col(SplitExpense.group_id) == filters.group_id)
    elif filters.contact_id is not None:
        repository.get_contact(ctx.session, query.user_id, filters.contact_id)
        share_split_ids = select(SplitShare.split_expense_id).where(col(SplitShare.contact_id) == filters.contact_id)
        stmt = select(SplitExpense).where(
            col(SplitExpense.owner_id) == query.user_id,
            col(SplitExpense.group_id).is_(None),
            or_(
                col(SplitExpense.paid_by_contact_id) == filters.contact_id,
                col(SplitExpense.id).in_(share_split_ids),
            ),
        )
    else:
        group_ids = list(my_member_by_group)
        direct_cond = col(SplitExpense.group_id).is_(None) & (col(SplitExpense.owner_id) == query.user_id)
        cond = direct_cond | col(SplitExpense.group_id).in_(group_ids) if group_ids else direct_cond
        stmt = select(SplitExpense).where(cond)

    if filters.currency is not None:
        stmt = stmt.where(col(SplitExpense.currency) == filters.currency)

    all_rows = list(ctx.session.exec(stmt.order_by(desc(col(SplitExpense.spent_on)), desc(col(SplitExpense.id)))).all())
    total = len(all_rows)
    page = all_rows[filters.offset : filters.offset + filters.limit]
    if not page:
        return SplitExpenseList(items=[], total=total)

    split_ids = [row.id for row in page if row.id is not None]
    shares_by_split: dict[int, list[SplitShare]] = {}
    for share in ctx.session.exec(select(SplitShare).where(col(SplitShare.split_expense_id).in_(split_ids))).all():
        shares_by_split.setdefault(share.split_expense_id, []).append(share)

    links = ctx.session.exec(
        select(SplitExpenseLink).where(
            col(SplitExpenseLink.owner_id) == query.user_id,
            col(SplitExpenseLink.split_expense_id).in_(split_ids),
        )
    ).all()
    link_by_split = {link.split_expense_id: link for link in links}

    used_group_ids = {row.group_id for row in page if row.group_id is not None}
    groups_by_id: dict[int, SplitGroup] = {}
    members_by_id: dict[int, SplitGroupMember] = {}
    if used_group_ids:
        for group in ctx.session.exec(select(SplitGroup).where(col(SplitGroup.id).in_(used_group_ids))).all():
            if group.id is not None:
                groups_by_id[group.id] = group
        for member in ctx.session.exec(
            select(SplitGroupMember).where(col(SplitGroupMember.group_id).in_(used_group_ids))
        ).all():
            if member.id is not None:
                members_by_id[member.id] = member

    contact_ids = {
        *(row.paid_by_contact_id for row in page if row.paid_by_contact_id is not None),
        *(s.contact_id for slist in shares_by_split.values() for s in slist if s.contact_id is not None),
    }
    contacts_by_id = repository.get_contacts_by_ids(ctx.session, query.user_id, sorted(contact_ids))

    items = [
        build_split_read(
            ctx.session,
            row,
            viewer_id=query.user_id,
            group=groups_by_id.get(row.group_id) if row.group_id is not None else None,
            my_member=my_member_by_group.get(row.group_id) if row.group_id is not None else None,
            members_by_id=members_by_id,
            contacts_by_id=contacts_by_id,
            shares=shares_by_split.get(row.id, ()),
            my_link=link_by_split.get(row.id),
        )
        for row in page
        if row.id is not None
    ]
    return SplitExpenseList(items=items, total=total)
