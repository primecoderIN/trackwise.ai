"""Shared SQL helpers and cross-dialect column types (core layer).

- rows_affected: Session.execute() is typed as returning a generic Result, but a DELETE or UPDATE returns a
  CursorResult, which knows its rowcount.
- BigInt: 64-bit BIGINT in PostgreSQL, and INTEGER in SQLite (which is already 64-bit and aliases rowid on
  INTEGER PRIMARY KEY so auto-incrementing primary keys work identically on both dialects, D216).
"""

from typing import Any, cast

from sqlalchemy import BigInteger, CursorResult, Executable, Integer
from sqlmodel import Session

# 64-bit integer in PostgreSQL (BIGINT) and SQLite (INTEGER, which is 64-bit and required for rowid auto-increment).
BigInt = BigInteger().with_variant(Integer(), "sqlite")


def rows_affected(session: Session, statement: Executable) -> int:
    """Run a DELETE or UPDATE in `session` and return how many rows it touched."""
    return cast(CursorResult[Any], session.execute(statement)).rowcount
