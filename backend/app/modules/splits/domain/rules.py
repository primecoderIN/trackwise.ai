"""Pure domain validation and security helpers shared by splits slices (splits domain).

Covers case-folded name normalization, currency-exponent money parsing, strict UPI VPA syntax checks, and
cryptographically random SHA-256 hashed invite tokens.
"""

import hashlib
import re
import secrets
from decimal import Decimal

from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.money import currency_exponent, major_to_minor
from app.modules.splits.i18n import SplitText
from app.modules.splits.values import (
    DEFAULT_MEMBER_NAME,
    INVITE_HINT_LENGTH,
    INVITE_TOKEN_BYTES,
    INVITE_TOKEN_PREFIX,
    MAX_NAME_LENGTH,
    MAX_UPI_ID_LENGTH,
    UPI_ID_PATTERN,
)

_UPI_REGEX = re.compile(UPI_ID_PATTERN)


def normalize_name_key(name: str) -> str:
    """Trim and case-fold a contact or group name for race-free per-owner deduplication."""
    return name.strip().casefold()


def resolve_display_name(principal_name: str | None) -> str:
    """Clean display name for a signed-in user joining or creating a group; falls back to DEFAULT_MEMBER_NAME."""
    if principal_name is None:
        return DEFAULT_MEMBER_NAME
    cleaned = principal_name.strip()
    return cleaned[:MAX_NAME_LENGTH] if cleaned else DEFAULT_MEMBER_NAME


def validate_upi_id(value: str | None) -> str | None:
    """Check UPI VPA syntax (syntax-only: never represents bank-account verification, D226).

    Empty or whitespace-only strings normalize to None. Raises BusinessRuleError on invalid syntax.
    """
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > MAX_UPI_ID_LENGTH or _UPI_REGEX.fullmatch(cleaned) is None:
        raise BusinessRuleError(translatable(SplitText.INVALID_UPI_ID))
    return cleaned


def parse_amount_minor(amount: Decimal, currency: str, *, allow_zero: bool = False) -> int:
    """Convert major-unit `amount` to whole minor units using `currency`'s minor-unit exponent (D226).

    Raises BusinessRuleError when negative/non-positive or when decimals exceed `currency`'s precision.
    """
    try:
        minor = major_to_minor(amount, currency)
    except ValueError as exc:
        raise BusinessRuleError(
            translatable(SplitText.AMOUNT_PRECISION, currency=currency, decimals=currency_exponent(currency))
        ) from exc
    if allow_zero:
        if minor < 0:
            raise BusinessRuleError(translatable(SplitText.NEGATIVE_SHARE))
    elif minor <= 0:
        raise BusinessRuleError(translatable(SplitText.AMOUNT_NOT_POSITIVE))
    return minor


def mint_invite_token() -> tuple[str, str, str]:
    """Generate a 256-bit invite token, returning `(raw_token, sha256_hex_hash, last_4_hint)`."""
    raw = f"{INVITE_TOKEN_PREFIX}{secrets.token_urlsafe(INVITE_TOKEN_BYTES)}"
    return raw, hash_invite_token(raw), raw[-INVITE_HINT_LENGTH:]


def hash_invite_token(raw_token: str) -> str:
    """Deterministic SHA-256 hex digest stored in `split_group_invite.token_hash` (never store raw tokens)."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
