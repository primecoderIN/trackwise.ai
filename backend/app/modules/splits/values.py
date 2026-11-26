"""The splits module's shared values: ids, enums, field limits, and validated input types.

Part of the splits module's contract layer; imports no other file of this module. Used by commands, queries,
models, domain rules, tables, API schemas, and scripts/export_contracts.py.
"""

from datetime import date
from decimal import Decimal
from enum import IntEnum, StrEnum
from typing import Annotated

from pydantic import AfterValidator, Field

from app.core.ids import RecordId
from app.core.months import MAX_DATE, MIN_DATE

# Text and collection limits, shared with the tables and exported to the web app.
MAX_NAME_LENGTH = 80
MAX_DESCRIPTION_LENGTH = 120
MAX_CONTACT_NOTE_LENGTH = 200
MAX_NOTE_LENGTH = 500
MAX_SETTLEMENT_NOTE_LENGTH = 300
MAX_UPI_ID_LENGTH = 100
MAX_PARTICIPANTS = 50
MAX_ACTIVE_INVITES = 10
MAX_INVITE_USES = 20
DEFAULT_LIST_LIMIT = 50
MAX_LIST_LIMIT = 100

# Invite token wire format: prefix + 32 random URL-safe bytes (~43 chars), hashed with SHA-256 (64 hex chars).
INVITE_TOKEN_PREFIX = "spwi_"
INVITE_TOKEN_BYTES = 32
INVITE_TOKEN_HASH_LENGTH = 64
INVITE_HINT_LENGTH = 4
MIN_INVITE_TOKEN_LENGTH = 20
MAX_INVITE_TOKEN_LENGTH = 128

# Strict UPI VPA syntax (e.g. "ravi@okhdfcbank"). Syntax-only: does not verify bank ownership (D226).
UPI_ID_PATTERN = r"^[a-zA-Z0-9._-]{2,64}@[a-zA-Z0-9.-]{2,32}$"

# Default fallback display label when an OIDC profile omits a user's name.
DEFAULT_MEMBER_NAME = "Member"


# Personal (single-owner) vs. Shared (multi-owner) group modes (D226).
class GroupKind(StrEnum):
    PERSONAL = "personal"
    SHARED = "shared"


# Role inside a split_group_member row; exactly one active OWNER per group.
class MemberRole(StrEnum):
    OWNER = "owner"
    MEMBER = "member"


# Split allocation methods supported in V1 (extensible for percentage/shares later).
class SplitMethod(StrEnum):
    EQUAL = "equal"
    EXACT = "exact"


# Direction of an obligation relative to the signed-in user.
class BalanceDirection(StrEnum):
    OWED_TO_YOU = "owed_to_you"
    YOU_OWE = "you_owe"
    SETTLED = "settled"


# Context for an item on the People tab (never netted across distinct contexts, D226).
class BalanceContextKind(StrEnum):
    DIRECT = "direct"
    GROUP = "group"


# Allowed invite lifetimes (days) when generating a shared-group invite link.
class InviteLifetime(IntEnum):
    ONE_DAY = 1
    SEVEN_DAYS = 7
    THIRTY_DAYS = 30


DEFAULT_INVITE_LIFETIME = InviteLifetime.SEVEN_DAYS


# Workflow states for per-user split_expense_link records (idempotent personal expense recording, D226).
class ExpenseLinkStatus(StrEnum):
    RECORDING = "recording"
    LINKED = "linked"


ContactId = RecordId
GroupId = RecordId
MemberId = RecordId
InviteId = RecordId
SplitExpenseId = RecordId
SettlementId = RecordId

# Major-unit decimal accepting up to 3 decimal places (supports KWD=3, USD/INR=2, JPY=0; exact currency precision
# is validated against core.money.currency_exponent in domain/rules.py).
SplitAmount = Annotated[Decimal, Field(max_digits=14, decimal_places=3, examples=["45.50"])]
DisplayName = Annotated[str, Field(min_length=1, max_length=MAX_NAME_LENGTH)]
SplitDescription = Annotated[str, Field(min_length=1, max_length=MAX_DESCRIPTION_LENGTH)]
ContactNote = Annotated[str, Field(max_length=MAX_CONTACT_NOTE_LENGTH)]
SplitNote = Annotated[str, Field(max_length=MAX_NOTE_LENGTH)]
SettlementNote = Annotated[str, Field(max_length=MAX_SETTLEMENT_NOTE_LENGTH)]
UpiIdInput = Annotated[str, Field(max_length=MAX_UPI_ID_LENGTH, pattern=UPI_ID_PATTERN, examples=["ravi@okhdfcbank"])]
InviteTokenInput = Annotated[str, Field(min_length=MIN_INVITE_TOKEN_LENGTH, max_length=MAX_INVITE_TOKEN_LENGTH)]


def _check_date(value: date) -> date:
    """Keep every split and settlement date inside trackwise.ai's 1900-2099 span."""
    if not (MIN_DATE <= value <= MAX_DATE):
        raise ValueError("date must be between 1900-01-01 and 2099-12-31")
    return value


SplitDate = Annotated[date, AfterValidator(_check_date)]
