"""DeleteContact: permanently remove an unreferenced contact (splits command slice)."""

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.values import ContactId


class DeleteContact(Command[None]):
    """Delete an unused contact owned by `owner_id`; refuses if referenced by groups, splits, or settlements."""

    owner_id: UserId
    contact_id: ContactId


def delete_contact(ctx: Context, command: DeleteContact) -> None:
    """Remove `contact_id` only if unreferenced; otherwise instruct the user to archive it (D226)."""
    contact = repository.get_contact(ctx.session, command.owner_id, command.contact_id)
    if repository.contact_is_referenced(ctx.session, command.owner_id, command.contact_id):
        raise BusinessRuleError(translatable(SplitText.CONTACT_IN_USE))
    ctx.session.delete(contact)
