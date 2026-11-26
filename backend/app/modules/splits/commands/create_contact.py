"""CreateContact: add a contact to the signed-in user's private splits address book (splits command slice)."""

from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.rules import normalize_name_key, validate_upi_id
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitContact
from app.modules.splits.values import ContactNote, DisplayName, UpiIdInput


# REST body for POST /splits/contacts (no owner_id; server supplies it from session, D190).
class NewContact(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    name: DisplayName
    upi_id: UpiIdInput | None = None
    note: ContactNote | None = None


class CreateContact(Command[int]):
    """Add one private contact for `owner_id`, returning its new id."""

    owner_id: UserId
    contact: NewContact


def create_contact(ctx: Context, command: CreateContact) -> int:
    """Create a unique case-folded contact for `owner_id`, enforcing per-owner uniqueness and UPI syntax."""
    name = command.contact.name.strip()
    name_key = normalize_name_key(name)
    existing = ctx.session.exec(
        select(SplitContact.id).where(
            col(SplitContact.owner_id) == command.owner_id,
            col(SplitContact.name_key) == name_key,
        )
    ).first()
    if existing is not None:
        raise BusinessRuleError(translatable(SplitText.CONTACT_DUPLICATE, name=name))

    upi_id = validate_upi_id(command.contact.upi_id)
    note = command.contact.note.strip() if command.contact.note else None
    row = SplitContact(
        owner_id=command.owner_id,
        name=name,
        name_key=name_key,
        upi_id=upi_id,
        note=note or None,
        archived_at=None,
        created_at=ctx.clock.now(),
    )
    ctx.session.add(row)
    try:
        ctx.session.flush()
    except IntegrityError as exc:
        raise BusinessRuleError(translatable(SplitText.CONTACT_DUPLICATE, name=name)) from exc
    assert row.id is not None
    return row.id
