"""The accounts module's read models: frozen copies the queries and commands return, never table rows.

Used by several slices and by the use cases (application/). CurrentUser and SignedInUser are also what
GET /auth/user answers; SessionRead, AccessTokenRead, CreatedAccessToken and NewAccessToken are the account routes'
(account_api.py); the rest stay inside the module.
"""

from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.clock import DEFAULT_TIMEZONE, TimeZoneName, UtcDateTime
from app.core.i18n import DEFAULT_LANGUAGE, Language
from app.core.money import DEFAULT_USER_CURRENCY, SupportedCurrencyCode
from app.modules.accounts.values import (
    CURRENT_TERMS_VERSION,
    DEFAULT_TOKEN_LIFETIME,
    MAX_TERMS_VERSION_LENGTH,
    MAX_TOKEN_NAME_LENGTH,
    TokenLifetime,
)


# Who is signed in: what the web app shows (name, email, picture, onboarding state, and account preferences).
# GetCurrentUser returns it.
class CurrentUser(BaseModel):
    model_config = ConfigDict(frozen=True, from_attributes=True)

    id: int
    name: str | None
    email: str | None
    avatar_url: str | None
    preferred_language: Language = DEFAULT_LANGUAGE
    default_currency: str = DEFAULT_USER_CURRENCY
    timezone: str = DEFAULT_TIMEZONE
    welcomed_at: UtcDateTime | None = None
    terms_version: str | None = None
    terms_accepted_at: UtcDateTime | None = None


# The body of POST /account/welcome: records onboarding preferences, welcome completion, and accepted terms version.
class WelcomeAcceptance(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    terms_version: str = Field(default=CURRENT_TERMS_VERSION, min_length=1, max_length=MAX_TERMS_VERSION_LENGTH)
    preferred_language: Language = DEFAULT_LANGUAGE
    default_currency: SupportedCurrencyCode = DEFAULT_USER_CURRENCY
    timezone: TimeZoneName = DEFAULT_TIMEZONE


# The body of PATCH /account/preferences: send only the preference fields you want to update.
class UserPreferencesChange(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    preferred_language: Language | None = None
    default_currency: SupportedCurrencyCode | None = None
    timezone: TimeZoneName | None = None

    @model_validator(mode="after")
    def require_non_null_changes(self) -> Self:
        """Refuse explicit null values; omit a field to keep its stored preference."""
        cleared = sorted(name for name in self.model_fields_set if getattr(self, name) is None)
        if cleared:
            raise ValueError(f"{', '.join(cleared)} can't be null; leave a field out to keep it as it is")
        return self


# GET /auth/user's answer: the person, and the link that signs this browser out (it carries the session's handle).
class SignedInUser(CurrentUser):
    logout_url: str


# One of the sign-in page's buttons (GET /auth/options): what it sends back as ?option=, and what it says.
class LoginOptionRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    key: str
    label: str


# A live session, as GetSession finds it: whose it is, its public handle, when it was renewed, and preferences.
class SessionView(BaseModel):
    model_config = ConfigDict(frozen=True)

    session_id: int
    user_id: int
    handle: str
    renewed_at: datetime
    preferred_language: Language = DEFAULT_LANGUAGE
    default_currency: str = DEFAULT_USER_CURRENCY
    timezone: str = DEFAULT_TIMEZONE


# What the callback checks a sign-in against: TakeLoginAttempt returns it, once.
class LoginAttemptView(BaseModel):
    model_config = ConfigDict(frozen=True, from_attributes=True)

    state: str
    nonce: str
    code_verifier: str
    return_to: str


# What signing out needs from a session: the sealed ID token, to name it to the provider.
class SignOutView(BaseModel):
    model_config = ConfigDict(frozen=True)

    sealed_id_token: str | None


# One of the signed-in person's live sessions, as Settings lists them (GET /account/sessions). `current` is the
# session the request came from (this browser); ListSessions leaves it False and the route sets it.
class SessionRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: int
    created_at: UtcDateTime
    # When it was last renewed: the session was used then (renewal is written at most every RENEW_AFTER).
    last_active_at: UtcDateTime
    # The browser's own description at sign-in (user data: shown as it is, to its owner only).
    user_agent: str | None
    current: bool = False


# One of the person's access tokens, as Settings lists them (GET /account/tokens): never the token itself.
class AccessTokenRead(BaseModel):
    model_config = ConfigDict(frozen=True, from_attributes=True)

    id: int
    name: str
    # The token's last few characters, to match it to the one copied.
    hint: str
    created_at: UtcDateTime
    expires_at: UtcDateTime
    last_used_at: UtcDateTime | None
    # Whether it has stopped working, by the server's clock (the one that decides): ListAccessTokens sets it.
    expired: bool = False


# POST /account/tokens's answer: the new token's details and the token itself, the only time it's ever sent.
class CreatedAccessToken(AccessTokenRead):
    token: str


# The body of POST /account/tokens: what to call the new token, and how many days it works.
class NewAccessToken(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=MAX_TOKEN_NAME_LENGTH)
    lifetime_days: TokenLifetime = DEFAULT_TOKEN_LIFETIME


# Whose a working token is, as FindTokenOwner finds it: the token (to note its use), its owner, and preferences.
class TokenOwner(BaseModel):
    model_config = ConfigDict(frozen=True)

    token_id: int
    user_id: int
    last_used_at: datetime | None
    preferred_language: Language = DEFAULT_LANGUAGE
    default_currency: str = DEFAULT_USER_CURRENCY
    timezone: str = DEFAULT_TIMEZONE
