"""All tables owned by the splits module, re-exported together with TABLES for migrations (splits persistence)."""

from app.modules.splits.persistence.group_tables import (
    SplitContact,
    SplitGroup,
    SplitGroupInvite,
    SplitGroupMember,
    SplitProfile,
)
from app.modules.splits.persistence.ledger_tables import (
    SplitExpense,
    SplitExpenseLink,
    SplitSettlement,
    SplitShare,
)

# Every table this module owns, handed to bootstrap.metadata() via module.TABLES.
TABLES = (
    SplitProfile,
    SplitContact,
    SplitGroup,
    SplitGroupMember,
    SplitGroupInvite,
    SplitExpense,
    SplitShare,
    SplitSettlement,
    SplitExpenseLink,
)

__all__ = [
    "TABLES",
    "SplitContact",
    "SplitExpense",
    "SplitExpenseLink",
    "SplitGroup",
    "SplitGroupInvite",
    "SplitGroupMember",
    "SplitProfile",
    "SplitSettlement",
    "SplitShare",
]
