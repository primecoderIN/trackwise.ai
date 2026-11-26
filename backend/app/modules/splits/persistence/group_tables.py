"""Splits tables for user UPI profiles, contacts, groups, memberships, and invites (splits persistence).

Private to the splits module. Foreign keys stay strictly inside splits (D13); references to app_user.id are plain
BigInt columns. Created and changed exclusively through Alembic migrations (0014_splits).
"""

from datetime import datetime

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, text
from sqlmodel import Field, SQLModel

from app.core.sql import BigInt
from app.modules.splits.values import (
    INVITE_HINT_LENGTH,
    INVITE_TOKEN_HASH_LENGTH,
    MAX_CONTACT_NOTE_LENGTH,
    MAX_NAME_LENGTH,
    MAX_UPI_ID_LENGTH,
)

ACTIVE_OWNER_WHERE = text("role = 'owner' AND left_at IS NULL")
MEMBER_USER_WHERE = text("user_id IS NOT NULL")
ACTIVE_CONTACT_WHERE = text("contact_id IS NOT NULL AND left_at IS NULL")


# Optional per-user UPI receive profile, owned strictly by owner_id (D226).
class SplitProfile(SQLModel, table=True):
    """Per-user receive-payment preferences for INR UPI QR generation. Private to splits."""

    __tablename__ = "split_profile"  # pyright: ignore[reportAssignmentType]

    owner_id: int = Field(sa_type=BigInt, primary_key=True)
    upi_id: str | None = Field(default=None, max_length=MAX_UPI_ID_LENGTH)
    # Opt-in flag: co-members in shared groups only see upi_id when this is True (D226).
    share_upi_with_groups: bool = False
    updated_at: datetime = Field(sa_type=DateTime(timezone=True))


# One person in an owner's private splits address book (direct splits and personal/guest group seats).
class SplitContact(SQLModel, table=True):
    """Owner-scoped contact for direct splits and personal/guest group membership. Private to splits."""

    __tablename__ = "split_contact"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        Index("ix_split_contact_owner_id", "owner_id"),
        Index("uq_split_contact_owner_name_key", "owner_id", "name_key", unique=True),
    )

    id: int | None = Field(default=None, sa_type=BigInt, primary_key=True)
    owner_id: int = Field(sa_type=BigInt)
    name: str = Field(max_length=MAX_NAME_LENGTH)
    name_key: str = Field(max_length=MAX_NAME_LENGTH)
    # Strictly private to owner_id; never exposed to other users in shared groups.
    upi_id: str | None = Field(default=None, max_length=MAX_UPI_ID_LENGTH)
    note: str | None = Field(default=None, max_length=MAX_CONTACT_NOTE_LENGTH)
    archived_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    created_at: datetime = Field(sa_type=DateTime(timezone=True))


# A Personal (single-owner) or Shared (multi-owner) bill-splitting group.
class SplitGroup(SQLModel, table=True):
    """Bill-splitting group (personal or shared). Private to splits."""

    __tablename__ = "split_group"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        CheckConstraint("kind IN ('personal', 'shared')", name="ck_split_group_kind"),
        Index("ix_split_group_owner_id", "owner_id"),
        Index("uq_split_group_owner_name_key", "owner_id", "name_key", unique=True),
    )

    id: int | None = Field(default=None, sa_type=BigInt, primary_key=True)
    owner_id: int = Field(sa_type=BigInt)
    kind: str = Field(max_length=16)
    name: str = Field(max_length=MAX_NAME_LENGTH)
    name_key: str = Field(max_length=MAX_NAME_LENGTH)
    default_currency: str | None = Field(default=None, max_length=3)
    archived_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    created_at: datetime = Field(sa_type=DateTime(timezone=True))


# Unified participant identity inside a group: registered user OR guest/contact seat (D226).
class SplitGroupMember(SQLModel, table=True):
    """One participant slot inside a SplitGroup. Private to splits."""

    __tablename__ = "split_group_member"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        CheckConstraint("role IN ('owner', 'member')", name="ck_split_group_member_role"),
        CheckConstraint(
            "NOT (user_id IS NOT NULL AND contact_id IS NOT NULL)",
            name="ck_split_group_member_identity_exclusive",
        ),
        CheckConstraint("role != 'owner' OR user_id IS NOT NULL", name="ck_split_group_member_owner_registered"),
        Index("ix_split_group_member_group_id", "group_id"),
        Index("ix_split_group_member_user_group", "user_id", "group_id"),
        Index(
            "uq_split_group_member_active_owner",
            "group_id",
            unique=True,
            sqlite_where=ACTIVE_OWNER_WHERE,
            postgresql_where=ACTIVE_OWNER_WHERE,
        ),
        Index(
            "uq_split_group_member_user",
            "group_id",
            "user_id",
            unique=True,
            sqlite_where=MEMBER_USER_WHERE,
            postgresql_where=MEMBER_USER_WHERE,
        ),
        Index(
            "uq_split_group_member_active_contact",
            "group_id",
            "contact_id",
            unique=True,
            sqlite_where=ACTIVE_CONTACT_WHERE,
            postgresql_where=ACTIVE_CONTACT_WHERE,
        ),
    )

    id: int | None = Field(default=None, sa_type=BigInt, primary_key=True)
    group_id: int = Field(
        sa_column=Column(BigInt, ForeignKey("split_group.id", ondelete="CASCADE"), nullable=False),
    )
    user_id: int | None = Field(default=None, sa_type=BigInt)
    contact_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_contact.id"), nullable=True),
    )
    display_name: str = Field(max_length=MAX_NAME_LENGTH)
    role: str = Field(max_length=16)
    added_by_user_id: int = Field(sa_type=BigInt)
    joined_at: datetime = Field(sa_type=DateTime(timezone=True))
    left_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))


# Expiring, revocable, SHA-256 hashed invite link for Shared groups (D226).
class SplitGroupInvite(SQLModel, table=True):
    """Hashed invite link for joining a shared group or claiming a guest seat. Private to splits."""

    __tablename__ = "split_group_invite"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        CheckConstraint(
            "max_uses >= 1 AND use_count >= 0 AND use_count <= max_uses", name="ck_split_group_invite_uses"
        ),
        Index("ix_split_group_invite_group_id", "group_id"),
        Index("ix_split_group_invite_expires_at", "expires_at"),
        Index("uq_split_group_invite_token_hash", "token_hash", unique=True),
    )

    id: int | None = Field(default=None, sa_type=BigInt, primary_key=True)
    group_id: int = Field(
        sa_column=Column(BigInt, ForeignKey("split_group.id", ondelete="CASCADE"), nullable=False),
    )
    created_by_user_id: int = Field(sa_type=BigInt)
    token_hash: str = Field(max_length=INVITE_TOKEN_HASH_LENGTH)
    hint: str = Field(max_length=INVITE_HINT_LENGTH)
    target_member_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_group_member.id"), nullable=True),
    )
    max_uses: int
    use_count: int = 0
    expires_at: datetime = Field(sa_type=DateTime(timezone=True))
    revoked_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    created_at: datetime = Field(sa_type=DateTime(timezone=True))
