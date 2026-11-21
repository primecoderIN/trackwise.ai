"""CompleteWelcome: record that the signed-in person finished the first-run welcome flow and accepted the terms.

A slice of the accounts module's write side. POST /account/welcome sends it; module.py registers the handler.
Stored on the server with the account so it follows the person across devices and never lives in browser storage (D192).
"""

from pydantic import Field
from sqlmodel import select

from app.core.clock import as_utc
from app.core.cqrs import Command, Context
from app.core.errors import NotFoundError
from app.modules.accounts.persistence.tables import AppUser
from app.modules.accounts.values import CURRENT_TERMS_VERSION, MAX_TERMS_VERSION_LENGTH, UserId


# Sent by POST /account/welcome for the signed-in person.
class CompleteWelcome(Command[None]):
    """Marks the person's welcome flow complete and records the accepted terms version."""

    owner_id: UserId
    terms_version: str = Field(default=CURRENT_TERMS_VERSION, min_length=1, max_length=MAX_TERMS_VERSION_LENGTH)


def complete_welcome(ctx: Context, command: CompleteWelcome) -> None:
    """Record `welcomed_at` (if not already set) and the latest `terms_version` and `terms_accepted_at`."""
    user = ctx.session.exec(select(AppUser).where(AppUser.id == command.owner_id)).first()
    if user is None:
        raise NotFoundError(f"user {command.owner_id} not found")
    now = ctx.clock.now()
    if user.welcomed_at is None:
        user.welcomed_at = now
    else:
        user.welcomed_at = as_utc(user.welcomed_at)
    user.terms_version = command.terms_version
    user.terms_accepted_at = now
    user.updated_at = now
    ctx.session.add(user)
