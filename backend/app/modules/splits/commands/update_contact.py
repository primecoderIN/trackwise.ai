"""UpdateContact: edit a contact's name, UPI ID, note, or archive status (splits command slice)."""

from typing import Self

from pydantic import BaseModel, ConfigDict, model_validator
from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.rules import normalize_name_key, validate_upi_id
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitContact
from app.modules.splits.values import ContactId, ContactNote, DisplayName, UpiIdInput


# REST body for PATCH /splits/contacts/{contact_id}; omit fields to leave unchanged, null clears upi_id/note.
class ContactChanges(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    name: DisplayName | None = None
    upi_id: UpiIdInput | None = None
    note: ContactNote | None = None
    archived: bool | None = None

    @model_validator(mode="after")
    def reject_null_required(self) -> Self:
        """Refuse explicit null on non-nullable fields (name, archived)."""
        for field in ("name", "archived"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class UpdateContact(Command[None]):
    """Apply partial changes to one of `owner_id`'s contacts."""

    owner_id: UserId
    contact_id: ContactId
    changes: ContactChanges


def update_contact(ctx: Context, command: UpdateContact) -> None:
    """Update a contact's profile or archival state, enforcing per-owner name uniqueness."""
    contact = repository.get_contact(ctx.session, command.owner_id, command.contact_id)
    fields = command.changes.model_fields_set

    if "name" in fields and command.changes.name is not None:
        new_name = command.changes.name.strip()
        new_key = normalize_name_key(new_name)
        conflict = ctx.session.exec(
            select(SplitContact.id).where(
                col(SplitContact.owner_id) == command.owner_id,
                col(SplitContact.name_key) == new_key,
                col(SplitContact.id) != command.contact_id,
            )
        ).first()
        if conflict is not None:
            raise BusinessRuleError(translatable(SplitText.CONTACT_DUPLICATE, name=new_name))
        contact.name = new_name
        contact.name_key = new_key

    if "upi_id" in fields:
        contact.upi_id = validate_upi_id(command.changes.upi_id)
    if "note" in fields:
        raw_note = command.changes.note
        contact.note = raw_note.strip() or None if raw_note is not None else None
    if "archived" in fields and command.changes.archived is not None:
        contact.archived_at = ctx.clock.now() if command.changes.archived else None

    try:
        ctx.session.flush()
    except IntegrityError as exc:
        raise BusinessRuleError(translatable(SplitText.CONTACT_DUPLICATE, name=contact.name)) from exc
