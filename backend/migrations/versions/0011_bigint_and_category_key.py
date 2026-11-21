"""Widen every id and money column to 64-bit BigInteger, and give categories a case-folded name_key.

- PostgreSQL's INTEGER is a 32-bit signed int4 (max 2,147,483,647), while SpendWise's ids and paise amounts
  allow up to 64-bit signed values (core/ids.py MAX_ID, money in paise). Every primary key, user/category id
  reference and minor-unit amount column becomes BigInteger (BIGINT in PostgreSQL, INTEGER in SQLite).
- category.name_key stores the trimmed, case-folded category name with a unique index, enforcing case-insensitive
  uniqueness in the database as well as in the command handler.

Revision ID: 0011
Revises: 0010
Create Date: 2026-11-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import context, op

revision: str = "0011"
down_revision: str | Sequence[str] | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

NAME_LENGTH = 50
NAME_KEY_INDEX = "ix_category_name_key"

# (table_name, [(column_name, nullable), ...])
BIGINT_COLUMNS: tuple[tuple[str, tuple[tuple[str, bool], ...]], ...] = (
    ("app_user", (("id", False),)),
    ("user_identity", (("id", False), ("user_id", False))),
    ("user_session", (("id", False), ("user_id", False))),
    ("login_attempt", (("id", False),)),
    ("access_token", (("id", False), ("user_id", False))),
    ("category", (("id", False),)),
    (
        "expense",
        (
            ("id", False),
            ("owner_id", False),
            ("amount_minor", False),
            ("base_amount_minor", True),
            ("category_id", False),
        ),
    ),
    (
        "budget",
        (
            ("id", False),
            ("owner_id", False),
            ("category_id", True),
            ("limit_minor", False),
        ),
    ),
    ("conversation_message", (("id", False), ("owner_id", False))),
    ("pending_approval", (("owner_id", False),)),
    ("pending_delegation", (("owner_id", False),)),
    ("receipt_file", (("id", False), ("owner_id", False))),
)


def _alter_int_columns(from_type: sa.types.TypeEngine, to_type: sa.types.TypeEngine) -> None:
    """Change every listed id and minor-unit money column from `from_type` to `to_type` on PostgreSQL.

    In SQLite, INTEGER is already a 64-bit signed integer and `INTEGER PRIMARY KEY` must keep the type name
    `INTEGER` to alias `rowid` for auto-increment (core/sql.py's `BigInt` uses the `Integer()` variant on SQLite).
    """
    if not context.is_offline_mode() and op.get_bind().dialect.name == "sqlite":
        return
    for table, columns in BIGINT_COLUMNS:
        with op.batch_alter_table(table, schema=None) as batch_op:
            for column, nullable in columns:
                batch_op.alter_column(
                    column,
                    existing_type=from_type,
                    type_=to_type,
                    existing_nullable=nullable,
                )


def _add_category_name_key() -> None:
    """Add category.name_key, fill it from existing names, then make it NOT NULL and unique."""
    with op.batch_alter_table("category", schema=None) as batch_op:
        batch_op.add_column(sa.Column("name_key", sa.String(length=NAME_LENGTH), nullable=True))

    if context.is_offline_mode():
        op.execute(sa.text("UPDATE category SET name_key = LOWER(TRIM(name))"))
    else:
        connection = op.get_bind()
        rows = connection.execute(sa.text("SELECT id, name FROM category")).fetchall()
        for row_id, name in rows:
            connection.execute(
                sa.text("UPDATE category SET name_key = :key WHERE id = :id"),
                {"key": str(name).strip().casefold(), "id": row_id},
            )

    with op.batch_alter_table("category", schema=None) as batch_op:
        batch_op.alter_column("name_key", existing_type=sa.String(length=NAME_LENGTH), nullable=False)
        batch_op.create_index(NAME_KEY_INDEX, ["name_key"], unique=True)


def upgrade() -> None:
    """Widen id and minor-unit columns to BigInteger and add category.name_key."""
    _alter_int_columns(sa.Integer(), sa.BigInteger())
    _add_category_name_key()


def downgrade() -> None:
    """Drop category.name_key and narrow id and minor-unit columns back to Integer."""
    with op.batch_alter_table("category", schema=None) as batch_op:
        batch_op.drop_index(NAME_KEY_INDEX)
        batch_op.drop_column("name_key")
    _alter_int_columns(sa.BigInteger(), sa.Integer())
