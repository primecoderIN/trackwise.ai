"""Create the splits module's nine tables, integrity constraints, and indexes (D226).

Supports both Personal (single-owner) and Shared (multi-owner) bill-splitting groups, guest-seat claiming via hashed
invite links, per-user private personal expense links, soft-voidable settlements, and opt-in UPI receive profiles.
Downgrade drops all nine tables in reverse dependency order.

Revision ID: 0014
Revises: 0013
Create Date: 2026-11-26
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0014"
down_revision: str | Sequence[str] | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Written out here, never imported from app code: migrations must stay self-contained.
BIG_INT = sa.BigInteger().with_variant(sa.Integer(), "sqlite")

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


def _create_profile_and_contacts() -> None:
    """Create split_profile and split_contact."""
    op.create_table(
        "split_profile",
        sa.Column("owner_id", BIG_INT, nullable=False),
        sa.Column("upi_id", sa.String(length=100), nullable=True),
        sa.Column("share_upi_with_groups", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("owner_id"),
    )
    op.create_table(
        "split_contact",
        sa.Column("id", BIG_INT, nullable=False),
        sa.Column("owner_id", BIG_INT, nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("name_key", sa.String(length=80), nullable=False),
        sa.Column("upi_id", sa.String(length=100), nullable=True),
        sa.Column("note", sa.String(length=200), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_split_contact_owner_id", "split_contact", ["owner_id"], unique=False)
    op.create_index("uq_split_contact_owner_name_key", "split_contact", ["owner_id", "name_key"], unique=True)


def _create_groups_members_and_invites() -> None:
    """Create split_group, split_group_member, and split_group_invite."""
    op.create_table(
        "split_group",
        sa.Column("id", BIG_INT, nullable=False),
        sa.Column("owner_id", BIG_INT, nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("name_key", sa.String(length=80), nullable=False),
        sa.Column("default_currency", sa.String(length=3), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("kind IN ('personal', 'shared')", name="ck_split_group_kind"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_split_group_owner_id", "split_group", ["owner_id"], unique=False)
    op.create_index("uq_split_group_owner_name_key", "split_group", ["owner_id", "name_key"], unique=True)

    op.create_table(
        "split_group_member",
        sa.Column("id", BIG_INT, nullable=False),
        sa.Column("group_id", BIG_INT, nullable=False),
        sa.Column("user_id", BIG_INT, nullable=True),
        sa.Column("contact_id", BIG_INT, nullable=True),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("added_by_user_id", BIG_INT, nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("role IN ('owner', 'member')", name="ck_split_group_member_role"),
        sa.CheckConstraint(
            "NOT (user_id IS NOT NULL AND contact_id IS NOT NULL)",
            name="ck_split_group_member_identity_exclusive",
        ),
        sa.CheckConstraint("role != 'owner' OR user_id IS NOT NULL", name="ck_split_group_member_owner_registered"),
        sa.ForeignKeyConstraint(["contact_id"], ["split_contact.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["split_group.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_split_group_member_group_id", "split_group_member", ["group_id"], unique=False)
    op.create_index("ix_split_group_member_user_group", "split_group_member", ["user_id", "group_id"], unique=False)
    op.create_index(
        "uq_split_group_member_active_owner",
        "split_group_member",
        ["group_id"],
        unique=True,
        sqlite_where=sa.text("role = 'owner' AND left_at IS NULL"),
        postgresql_where=sa.text("role = 'owner' AND left_at IS NULL"),
    )
    op.create_index(
        "uq_split_group_member_user",
        "split_group_member",
        ["group_id", "user_id"],
        unique=True,
        sqlite_where=sa.text("user_id IS NOT NULL"),
        postgresql_where=sa.text("user_id IS NOT NULL"),
    )
    op.create_index(
        "uq_split_group_member_active_contact",
        "split_group_member",
        ["group_id", "contact_id"],
        unique=True,
        sqlite_where=sa.text("contact_id IS NOT NULL AND left_at IS NULL"),
        postgresql_where=sa.text("contact_id IS NOT NULL AND left_at IS NULL"),
    )

    op.create_table(
        "split_group_invite",
        sa.Column("id", BIG_INT, nullable=False),
        sa.Column("group_id", BIG_INT, nullable=False),
        sa.Column("created_by_user_id", BIG_INT, nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("hint", sa.String(length=4), nullable=False),
        sa.Column("target_member_id", BIG_INT, nullable=True),
        sa.Column("max_uses", sa.Integer(), nullable=False),
        sa.Column("use_count", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "max_uses >= 1 AND use_count >= 0 AND use_count <= max_uses", name="ck_split_group_invite_uses"
        ),
        sa.ForeignKeyConstraint(["group_id"], ["split_group.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_member_id"], ["split_group_member.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_split_group_invite_group_id", "split_group_invite", ["group_id"], unique=False)
    op.create_index("ix_split_group_invite_expires_at", "split_group_invite", ["expires_at"], unique=False)
    op.create_index("uq_split_group_invite_token_hash", "split_group_invite", ["token_hash"], unique=True)


def _create_expenses_and_shares() -> None:
    """Create split_expense, split_share, and split_expense_link."""
    op.create_table(
        "split_expense",
        sa.Column("id", BIG_INT, nullable=False),
        sa.Column("owner_id", BIG_INT, nullable=False),
        sa.Column("group_id", BIG_INT, nullable=True),
        sa.Column("description", sa.String(length=120), nullable=False),
        sa.Column("amount_minor", BIG_INT, nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("paid_by_member_id", BIG_INT, nullable=True),
        sa.Column("paid_by_contact_id", BIG_INT, nullable=True),
        sa.Column("split_method", sa.String(length=20), nullable=False),
        sa.Column("spent_on", sa.Date(), nullable=False),
        sa.Column("note", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("amount_minor > 0", name="ck_split_expense_amount_positive"),
        sa.CheckConstraint("split_method IN ('equal', 'exact')", name="ck_split_expense_method"),
        sa.CheckConstraint(EXPENSE_PAYER_MODE_SQL, name="ck_split_expense_payer_mode"),
        sa.ForeignKeyConstraint(["group_id"], ["split_group.id"]),
        sa.ForeignKeyConstraint(["paid_by_contact_id"], ["split_contact.id"]),
        sa.ForeignKeyConstraint(["paid_by_member_id"], ["split_group_member.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_split_expense_owner_spent_on", "split_expense", ["owner_id", "spent_on"], unique=False)
    op.create_index("ix_split_expense_group_spent_on", "split_expense", ["group_id", "spent_on"], unique=False)

    op.create_table(
        "split_share",
        sa.Column("id", BIG_INT, nullable=False),
        sa.Column("split_expense_id", BIG_INT, nullable=False),
        sa.Column("member_id", BIG_INT, nullable=True),
        sa.Column("contact_id", BIG_INT, nullable=True),
        sa.Column("share_minor", BIG_INT, nullable=False),
        sa.CheckConstraint("share_minor >= 0", name="ck_split_share_non_negative"),
        sa.CheckConstraint(
            "NOT (member_id IS NOT NULL AND contact_id IS NOT NULL)",
            name="ck_split_share_participant_exclusive",
        ),
        sa.ForeignKeyConstraint(["contact_id"], ["split_contact.id"]),
        sa.ForeignKeyConstraint(["member_id"], ["split_group_member.id"]),
        sa.ForeignKeyConstraint(["split_expense_id"], ["split_expense.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_split_share_expense_id", "split_share", ["split_expense_id"], unique=False)
    op.create_index(
        "uq_split_share_expense_member",
        "split_share",
        ["split_expense_id", "member_id"],
        unique=True,
        sqlite_where=sa.text("member_id IS NOT NULL"),
        postgresql_where=sa.text("member_id IS NOT NULL"),
    )
    op.create_index(
        "uq_split_share_expense_contact",
        "split_share",
        ["split_expense_id", "contact_id"],
        unique=True,
        sqlite_where=sa.text("member_id IS NULL AND contact_id IS NOT NULL"),
        postgresql_where=sa.text("member_id IS NULL AND contact_id IS NOT NULL"),
    )
    op.create_index(
        "uq_split_share_expense_direct_self",
        "split_share",
        ["split_expense_id"],
        unique=True,
        sqlite_where=sa.text("member_id IS NULL AND contact_id IS NULL"),
        postgresql_where=sa.text("member_id IS NULL AND contact_id IS NULL"),
    )

    op.create_table(
        "split_expense_link",
        sa.Column("split_expense_id", BIG_INT, nullable=False),
        sa.Column("owner_id", BIG_INT, nullable=False),
        sa.Column("expense_id", BIG_INT, nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(EXPENSE_LINK_STATUS_SQL, name="ck_split_expense_link_status"),
        sa.ForeignKeyConstraint(["split_expense_id"], ["split_expense.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("split_expense_id", "owner_id"),
    )
    op.create_index("ix_split_expense_link_owner_id", "split_expense_link", ["owner_id"], unique=False)


def _create_settlements() -> None:
    """Create split_settlement."""
    op.create_table(
        "split_settlement",
        sa.Column("id", BIG_INT, nullable=False),
        sa.Column("owner_id", BIG_INT, nullable=False),
        sa.Column("group_id", BIG_INT, nullable=True),
        sa.Column("from_member_id", BIG_INT, nullable=True),
        sa.Column("to_member_id", BIG_INT, nullable=True),
        sa.Column("from_contact_id", BIG_INT, nullable=True),
        sa.Column("to_contact_id", BIG_INT, nullable=True),
        sa.Column("amount_minor", BIG_INT, nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("settled_on", sa.Date(), nullable=False),
        sa.Column("note", sa.String(length=300), nullable=True),
        sa.Column("voided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("voided_by_user_id", BIG_INT, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("amount_minor > 0", name="ck_split_settlement_amount_positive"),
        sa.CheckConstraint(SETTLEMENT_MODE_SQL, name="ck_split_settlement_mode"),
        sa.CheckConstraint(SETTLEMENT_VOID_PAIR_SQL, name="ck_split_settlement_void_pair"),
        sa.ForeignKeyConstraint(["from_contact_id"], ["split_contact.id"]),
        sa.ForeignKeyConstraint(["from_member_id"], ["split_group_member.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["split_group.id"]),
        sa.ForeignKeyConstraint(["to_contact_id"], ["split_contact.id"]),
        sa.ForeignKeyConstraint(["to_member_id"], ["split_group_member.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_split_settlement_owner_settled_on", "split_settlement", ["owner_id", "settled_on"], unique=False
    )
    op.create_index(
        "ix_split_settlement_group_settled_on", "split_settlement", ["group_id", "settled_on"], unique=False
    )


def upgrade() -> None:
    """Create all nine splits tables with constraints and indexes."""
    _create_profile_and_contacts()
    _create_groups_members_and_invites()
    _create_expenses_and_shares()
    _create_settlements()


def downgrade() -> None:
    """Drop all nine splits tables in reverse foreign-key order."""
    op.drop_table("split_settlement")
    op.drop_table("split_expense_link")
    op.drop_table("split_share")
    op.drop_table("split_expense")
    op.drop_table("split_group_invite")
    op.drop_table("split_group_member")
    op.drop_table("split_group")
    op.drop_table("split_contact")
    op.drop_table("split_profile")
