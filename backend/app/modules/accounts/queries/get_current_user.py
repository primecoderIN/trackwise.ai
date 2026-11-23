"""GetCurrentUser: the signed-in person's profile. The query and its handler; it changes nothing.

A slice of the accounts module's read side. GET /auth/user asks it for the person the request's session belongs to;
module.py registers the handler.
"""

from sqlmodel import select

from app.core.clock import as_utc
from app.core.cqrs import Context, Query
from app.core.errors import AuthenticationError
from app.core.i18n import Language
from app.modules.accounts.models import CurrentUser
from app.modules.accounts.persistence.tables import AppUser
from app.modules.accounts.values import UserId


# Asked by GET /auth/user with the user id of the request's session (web/auth.py's Principal).
class GetCurrentUser(Query[CurrentUser]):
    """The person's profile. Raises AuthenticationError if they're gone (the session can't stand for anyone)."""

    user_id: UserId


def get_current_user(ctx: Context, query: GetCurrentUser) -> CurrentUser:
    """The user's profile as last refreshed at sign-in and stored account preferences."""
    user = ctx.session.exec(select(AppUser).where(AppUser.id == query.user_id)).first()
    if user is None:
        raise AuthenticationError(f"user {query.user_id} doesn't exist")
    return CurrentUser(
        id=user.id,  # pyright: ignore[reportArgumentType]
        name=user.name,
        email=user.email,
        avatar_url=user.avatar_url,
        preferred_language=Language(user.preferred_language),
        default_currency=user.default_currency,
        timezone=user.timezone,
        welcomed_at=as_utc(user.welcomed_at) if user.welcomed_at is not None else None,
        terms_version=user.terms_version,
        terms_accepted_at=as_utc(user.terms_accepted_at) if user.terms_accepted_at is not None else None,
    )
