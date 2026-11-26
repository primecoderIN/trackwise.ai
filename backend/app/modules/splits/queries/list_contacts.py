"""ListContacts: list the signed-in user's private contacts (splits query slice)."""

from sqlmodel import col, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.models import ContactRead
from app.modules.splits.persistence.tables import SplitContact


class ListContacts(Query[list[ContactRead]]):
    """List contacts owned by `owner_id`, optionally including archived entries."""

    owner_id: UserId
    include_archived: bool = False


def list_contacts(ctx: Context, query: ListContacts) -> list[ContactRead]:
    """Return contacts owned by `owner_id` ordered alphabetically by case-folded name."""
    stmt = select(SplitContact).where(col(SplitContact.owner_id) == query.owner_id)
    if not query.include_archived:
        stmt = stmt.where(col(SplitContact.archived_at).is_(None))
    stmt = stmt.order_by(col(SplitContact.name_key))
    return [ContactRead.model_validate(row) for row in ctx.session.exec(stmt).all()]
