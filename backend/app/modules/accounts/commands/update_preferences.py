"""UpdatePreferences: update the signed-in person's account preferences (language, currency, timezone).

A slice of the accounts module's write side. PATCH /account/preferences sends it; module.py registers the handler.
"""

from sqlmodel import select

from app.core.cqrs import Command, Context
from app.core.errors import NotFoundError
from app.core.i18n import Language
from app.modules.accounts.models import UserPreferencesChange
from app.modules.accounts.persistence.tables import AppUser
from app.modules.accounts.values import UserId


# Sent by PATCH /account/preferences for the signed-in person.
class UpdatePreferences(Command[None]):
    """Update the fields sent in `changes` for `owner_id`."""

    owner_id: UserId
    changes: UserPreferencesChange


def update_preferences(ctx: Context, command: UpdatePreferences) -> None:
    """Apply sent preference fields on the owner's AppUser row and bump `updated_at`."""
    user = ctx.session.exec(select(AppUser).where(AppUser.id == command.owner_id)).first()
    if user is None:
        raise NotFoundError(f"user {command.owner_id} not found")
    changes = command.changes.model_dump(exclude_unset=True)
    if not changes:
        return
    if "preferred_language" in changes and isinstance(changes["preferred_language"], Language):
        changes["preferred_language"] = changes["preferred_language"].value
    for field, value in changes.items():
        setattr(user, field, value)
    user.updated_at = ctx.clock.now()
    ctx.session.add(user)
