"""Add preferred_language, default_currency, and timezone columns to app_user.

- app_user.preferred_language stores the user's preferred language code ('en' by default).
- app_user.default_currency stores the user's preferred ISO 4217 currency code ('USD' by default).
- app_user.timezone stores the user's IANA time zone name ('UTC' by default).

Revision ID: 0013
Revises: 0012
Create Date: 2026-11-23
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0013"
down_revision: str | Sequence[str] | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

LANGUAGE_LENGTH = 10
CURRENCY_LENGTH = 3
TIMEZONE_LENGTH = 64
DEFAULT_LANGUAGE = "en"
DEFAULT_CURRENCY = "USD"
DEFAULT_TIMEZONE = "UTC"


def upgrade() -> None:
    """Add preferred_language, default_currency, and timezone to app_user."""
    with op.batch_alter_table("app_user", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "preferred_language",
                sa.String(length=LANGUAGE_LENGTH),
                nullable=False,
                server_default=DEFAULT_LANGUAGE,
            )
        )
        batch_op.add_column(
            sa.Column(
                "default_currency",
                sa.String(length=CURRENCY_LENGTH),
                nullable=False,
                server_default=DEFAULT_CURRENCY,
            )
        )
        batch_op.add_column(
            sa.Column("timezone", sa.String(length=TIMEZONE_LENGTH), nullable=False, server_default=DEFAULT_TIMEZONE)
        )


def downgrade() -> None:
    """Drop preferred_language, default_currency, and timezone from app_user."""
    with op.batch_alter_table("app_user", schema=None) as batch_op:
        batch_op.drop_column("timezone")
        batch_op.drop_column("default_currency")
        batch_op.drop_column("preferred_language")
