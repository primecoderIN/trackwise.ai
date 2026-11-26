"""ListSettlements: list active and voided settlements visible to the caller (splits query slice)."""

from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import col, desc, or_, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.core.money import SupportedCurrencyCode
from app.modules.splits.domain.access import require_group_member
from app.modules.splits.ledger_models import SettlementList
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitGroup, SplitGroupMember, SplitSettlement
from app.modules.splits.queries.read_helpers import build_settlement_read
from app.modules.splits.values import DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT, ContactId, GroupId


# Query parameters for GET /splits/settlements.
class SettlementFilters(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    group_id: GroupId | None = None
    contact_id: ContactId | None = None
    currency: SupportedCurrencyCode | None = None
    include_voided: bool = True
    limit: int = Field(default=DEFAULT_LIST_LIMIT, ge=1, le=MAX_LIST_LIMIT)
    offset: int = Field(default=0, ge=0)


class ListSettlements(Query[SettlementList]):
    """List settlements accessible to `user_id`, newest first."""

    user_id: UserId
    filters: SettlementFilters = Field(default_factory=SettlementFilters)


def list_settlements(ctx: Context, query: ListSettlements) -> SettlementList:
    """Return authorized settlements matching `filters`."""
    filters = query.filters
    active_group_ids = list(
        ctx.session.exec(
            select(SplitGroupMember.group_id).where(
                col(SplitGroupMember.user_id) == query.user_id,
                col(SplitGroupMember.left_at).is_(None),
            )
        ).all()
    )

    if filters.group_id is not None:
        require_group_member(ctx.session, filters.group_id, query.user_id)
        stmt = select(SplitSettlement).where(col(SplitSettlement.group_id) == filters.group_id)
    elif filters.contact_id is not None:
        repository.get_contact(ctx.session, query.user_id, filters.contact_id)
        stmt = select(SplitSettlement).where(
            col(SplitSettlement.owner_id) == query.user_id,
            col(SplitSettlement.group_id).is_(None),
            or_(
                col(SplitSettlement.from_contact_id) == filters.contact_id,
                col(SplitSettlement.to_contact_id) == filters.contact_id,
            ),
        )
    else:
        direct_cond = col(SplitSettlement.group_id).is_(None) & (col(SplitSettlement.owner_id) == query.user_id)
        cond = direct_cond | col(SplitSettlement.group_id).in_(active_group_ids) if active_group_ids else direct_cond
        stmt = select(SplitSettlement).where(cond)

    if filters.currency is not None:
        stmt = stmt.where(col(SplitSettlement.currency) == filters.currency)
    if not filters.include_voided:
        stmt = stmt.where(col(SplitSettlement.voided_at).is_(None))

    rows = list(
        ctx.session.exec(stmt.order_by(desc(col(SplitSettlement.settled_on)), desc(col(SplitSettlement.id)))).all()
    )
    total = len(rows)
    page = rows[filters.offset : filters.offset + filters.limit]
    if not page:
        return SettlementList(items=[], total=total)

    group_ids = {r.group_id for r in page if r.group_id is not None}
    groups_by_id: dict[int, SplitGroup] = {}
    members_by_id: dict[int, SplitGroupMember] = {}
    if group_ids:
        for group in ctx.session.exec(select(SplitGroup).where(col(SplitGroup.id).in_(group_ids))).all():
            if group.id is not None:
                groups_by_id[group.id] = group
        for member in ctx.session.exec(
            select(SplitGroupMember).where(col(SplitGroupMember.group_id).in_(group_ids))
        ).all():
            if member.id is not None:
                members_by_id[member.id] = member

    contact_ids = {cid for row in page for cid in (row.from_contact_id, row.to_contact_id) if cid is not None}
    contacts_by_id = repository.get_contacts_by_ids(ctx.session, query.user_id, sorted(contact_ids))

    items = [
        build_settlement_read(
            row,
            viewer_id=query.user_id,
            group=groups_by_id.get(row.group_id) if row.group_id is not None else None,
            members_by_id=members_by_id,
            contacts_by_id=contacts_by_id,
        )
        for row in page
    ]
    return SettlementList(items=items, total=total)
