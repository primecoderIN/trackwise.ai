"""GetContact: fetch one private contact owned by the caller (splits query slice)."""

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.models import ContactRead
from app.modules.splits.persistence import repository
from app.modules.splits.values import ContactId


class GetContact(Query[ContactRead]):
    """Fetch one contact owned by `owner_id` (404 if missing or owned by someone else)."""

    owner_id: UserId
    contact_id: ContactId


def get_contact(ctx: Context, query: GetContact) -> ContactRead:
    """Read one contact belonging to `owner_id`."""
    contact = repository.get_contact(ctx.session, query.owner_id, query.contact_id)
    return ContactRead.model_validate(contact)
