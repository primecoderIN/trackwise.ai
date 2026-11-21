"""Add first-run welcome and terms acceptance fields to app_user.

- app_user.welcomed_at records when a person finished (or skipped) the first-run welcome flow (Phase 29).
- app_user.terms_version and app_user.terms_accepted_at record which version of the Terms of Service and Privacy
  Policy the person accepted, and when.

Revision ID: 0012
Revises: 0011
Create Date: 2026-11-21
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0012"
down_revision: str | Sequence[str] | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TERMS_VERSION_LENGTH = 32


def upgrade() -> None:
    """Add welcomed_at, terms_version and terms_accepted_at to app_user."""
    with op.batch_alter_table("app_user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("welcomed_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("terms_version", sa.String(length=TERMS_VERSION_LENGTH), nullable=True))
        batch_op.add_column(sa.Column("terms_accepted_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Drop welcomed_at, terms_version and terms_accepted_at from app_user."""
    with op.batch_alter_table("app_user", schema=None) as batch_op:
        batch_op.drop_column("terms_accepted_at")
        batch_op.drop_column("terms_version")
        batch_op.drop_column("welcomed_at")
