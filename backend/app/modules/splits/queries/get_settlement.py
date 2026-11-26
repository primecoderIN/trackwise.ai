"""GetSettlement: read one settlement authorized for the caller (splits query slice)."""

from sqlmodel import col, select

from app.core.cqrs import Context, Query
from app.core.errors import NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_member
from app.modules.splits.i18n import SplitText
from app.modules.splits.ledger_models import SettlementRead
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitContact, SplitGroup, SplitGroupMember, SplitSettlement
from app.modules.splits.queries.read_helpers import build_settlement_read
from app.modules.splits.values import SettlementId


class GetSettlement(Query[SettlementRead]):
    """Fetch one settlement visible to `user_id` (404 if missing or unauthorized)."""

    user_id: UserId
    settlement_id: SettlementId


def get_settlement(ctx: Context, query: GetSettlement) -> SettlementRead:
    """Authorize and project `settlement_id`."""
    row = ctx.session.exec(select(SplitSettlement).where(col(SplitSettlement.id) == query.settlement_id)).first()
    if row is None:
        raise NotFoundError(translatable(SplitText.SETTLEMENT_NOT_FOUND))

    group: SplitGroup | None = None
    members_by_id: dict[int, SplitGroupMember] = {}
    contacts_by_id: dict[int, SplitContact] = {}
    if row.group_id is not None:
        try:
            group, _ = require_group_member(ctx.session, row.group_id, query.user_id)
        except NotFoundError as exc:
            raise NotFoundError(translatable(SplitText.SETTLEMENT_NOT_FOUND)) from exc
        members = ctx.session.exec(select(SplitGroupMember).where(col(SplitGroupMember.group_id) == row.group_id)).all()
        members_by_id = {m.id: m for m in members if m.id is not None}
    else:
        if row.owner_id != query.user_id:
            raise NotFoundError(translatable(SplitText.SETTLEMENT_NOT_FOUND))
        cids = [cid for cid in (row.from_contact_id, row.to_contact_id) if cid is not None]
        contacts_by_id = repository.get_contacts_by_ids(ctx.session, query.user_id, cids)

    return build_settlement_read(
        row,
        viewer_id=query.user_id,
        group=group,
        members_by_id=members_by_id,
        contacts_by_id=contacts_by_id,
    )
