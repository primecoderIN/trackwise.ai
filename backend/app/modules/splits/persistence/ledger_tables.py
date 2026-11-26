"""Splits ledger tables: split_expense, split_share, split_settlement, and split_expense_link (splits persistence).

Private to the splits module. Foreign keys stay strictly inside splits (D13); split_expense_link.expense_id is a
plain BigInt reference to the expenses module. Created and changed exclusively via Alembic migrations (0014_splits).
"""

from datetime import date, datetime

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, text
from sqlmodel import Field, SQLModel

from app.core.sql import BigInt
from app.modules.splits.values import MAX_DESCRIPTION_LENGTH, MAX_NOTE_LENGTH, MAX_SETTLEMENT_NOTE_LENGTH

SHARE_MEMBER_WHERE = text("member_id IS NOT NULL")
SHARE_CONTACT_WHERE = text("member_id IS NULL AND contact_id IS NOT NULL")
SHARE_DIRECT_SELF_WHERE = text("member_id IS NULL AND contact_id IS NULL")

EXPENSE_PAYER_MODE_SQL = (
    "(group_id IS NOT NULL AND paid_by_member_id IS NOT NULL AND paid_by_contact_id IS NULL) "
    "OR (group_id IS NULL AND paid_by_member_id IS NULL)"
)
SETTLEMENT_MODE_SQL = (
    "(group_id IS NOT NULL AND from_member_id IS NOT NULL AND to_member_id IS NOT NULL "
    "AND from_contact_id IS NULL AND to_contact_id IS NULL AND from_member_id != to_member_id) "
    "OR (group_id IS NULL AND from_member_id IS NULL AND to_member_id IS NULL "
    "AND NOT (from_contact_id IS NULL AND to_contact_id IS NULL) "
    "AND (from_contact_id IS NULL OR to_contact_id IS NULL OR from_contact_id != to_contact_id))"
)
SETTLEMENT_VOID_PAIR_SQL = (
    "(voided_at IS NULL AND voided_by_user_id IS NULL) OR (voided_at IS NOT NULL AND voided_by_user_id IS NOT NULL)"
)
EXPENSE_LINK_STATUS_SQL = (
    "(status = 'recording' AND expense_id IS NULL) OR (status = 'linked' AND expense_id IS NOT NULL)"
)


# One shared expense (direct 1-on-1 when group_id is NULL, or inside a Personal/Shared group).
class SplitExpense(SQLModel, table=True):
    """A shared bill split across participants in a single currency. Private to splits."""

    __tablename__ = "split_expense"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        CheckConstraint("amount_minor > 0", name="ck_split_expense_amount_positive"),
        CheckConstraint("split_method IN ('equal', 'exact')", name="ck_split_expense_method"),
        CheckConstraint(EXPENSE_PAYER_MODE_SQL, name="ck_split_expense_payer_mode"),
        Index("ix_split_expense_owner_spent_on", "owner_id", "spent_on"),
        Index("ix_split_expense_group_spent_on", "group_id", "spent_on"),
    )

    id: int | None = Field(default=None, sa_type=BigInt, primary_key=True)
    owner_id: int = Field(sa_type=BigInt)
    group_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_group.id"), nullable=True),
    )
    description: str = Field(max_length=MAX_DESCRIPTION_LENGTH)
    amount_minor: int = Field(sa_type=BigInt)
    currency: str = Field(max_length=3)
    paid_by_member_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_group_member.id"), nullable=True),
    )
    paid_by_contact_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_contact.id"), nullable=True),
    )
    split_method: str = Field(max_length=20)
    spent_on: date
    note: str | None = Field(default=None, max_length=MAX_NOTE_LENGTH)
    created_at: datetime = Field(sa_type=DateTime(timezone=True))


# One participant's exact minor-unit share of a SplitExpense.
class SplitShare(SQLModel, table=True):
    """Per-participant share of a SplitExpense; shares sum strictly to amount_minor. Private to splits."""

    __tablename__ = "split_share"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        CheckConstraint("share_minor >= 0", name="ck_split_share_non_negative"),
        CheckConstraint(
            "NOT (member_id IS NOT NULL AND contact_id IS NOT NULL)", name="ck_split_share_participant_exclusive"
        ),
        Index("ix_split_share_expense_id", "split_expense_id"),
        Index(
            "uq_split_share_expense_member",
            "split_expense_id",
            "member_id",
            unique=True,
            sqlite_where=SHARE_MEMBER_WHERE,
            postgresql_where=SHARE_MEMBER_WHERE,
        ),
        Index(
            "uq_split_share_expense_contact",
            "split_expense_id",
            "contact_id",
            unique=True,
            sqlite_where=SHARE_CONTACT_WHERE,
            postgresql_where=SHARE_CONTACT_WHERE,
        ),
        Index(
            "uq_split_share_expense_direct_self",
            "split_expense_id",
            unique=True,
            sqlite_where=SHARE_DIRECT_SELF_WHERE,
            postgresql_where=SHARE_DIRECT_SELF_WHERE,
        ),
    )

    id: int | None = Field(default=None, sa_type=BigInt, primary_key=True)
    split_expense_id: int = Field(
        sa_column=Column(BigInt, ForeignKey("split_expense.id", ondelete="CASCADE"), nullable=False),
    )
    member_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_group_member.id"), nullable=True),
    )
    contact_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_contact.id"), nullable=True),
    )
    share_minor: int = Field(sa_type=BigInt)


# One recorded settlement repayment (soft-voidable via voided_at / voided_by_user_id, D226).
class SplitSettlement(SQLModel, table=True):
    """An auditable full or partial repayment reducing a direct or group obligation. Private to splits."""

    __tablename__ = "split_settlement"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        CheckConstraint("amount_minor > 0", name="ck_split_settlement_amount_positive"),
        CheckConstraint(SETTLEMENT_MODE_SQL, name="ck_split_settlement_mode"),
        CheckConstraint(SETTLEMENT_VOID_PAIR_SQL, name="ck_split_settlement_void_pair"),
        Index("ix_split_settlement_owner_settled_on", "owner_id", "settled_on"),
        Index("ix_split_settlement_group_settled_on", "group_id", "settled_on"),
    )

    id: int | None = Field(default=None, sa_type=BigInt, primary_key=True)
    owner_id: int = Field(sa_type=BigInt)
    group_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_group.id"), nullable=True),
    )
    from_member_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_group_member.id"), nullable=True),
    )
    to_member_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_group_member.id"), nullable=True),
    )
    from_contact_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_contact.id"), nullable=True),
    )
    to_contact_id: int | None = Field(
        default=None,
        sa_column=Column(BigInt, ForeignKey("split_contact.id"), nullable=True),
    )
    amount_minor: int = Field(sa_type=BigInt)
    currency: str = Field(max_length=3)
    settled_on: date
    note: str | None = Field(default=None, max_length=MAX_SETTLEMENT_NOTE_LENGTH)
    voided_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))
    voided_by_user_id: int | None = Field(default=None, sa_type=BigInt)
    created_at: datetime = Field(sa_type=DateTime(timezone=True))


# Strictly per-user private link between a SplitExpense and that user's personal expense row (D190, D226).
class SplitExpenseLink(SQLModel, table=True):
    """Per-user idempotent link between a split expense and a personal expense row. Private to splits."""

    __tablename__ = "split_expense_link"  # pyright: ignore[reportAssignmentType]
    __table_args__ = (
        CheckConstraint(EXPENSE_LINK_STATUS_SQL, name="ck_split_expense_link_status"),
        Index("ix_split_expense_link_owner_id", "owner_id"),
    )

    split_expense_id: int = Field(
        sa_column=Column(BigInt, ForeignKey("split_expense.id", ondelete="CASCADE"), primary_key=True),
    )
    owner_id: int = Field(sa_type=BigInt, primary_key=True)
    # Plain BigInt to expense.id (no cross-module FK, D13); NULL while status == 'recording'.
    expense_id: int | None = Field(default=None, sa_type=BigInt)
    status: str = Field(max_length=16)
    created_at: datetime = Field(sa_type=DateTime(timezone=True))
    updated_at: datetime = Field(sa_type=DateTime(timezone=True))
