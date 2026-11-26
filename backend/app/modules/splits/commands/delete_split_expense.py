"""DeleteSplitExpense: delete a split expense when authorized and not locked by a settlement (splits command slice)."""

from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import is_split_locked_by_settlement, require_split_edit_access
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitShare
from app.modules.splits.values import SplitExpenseId


class DeleteSplitExpense(Command[None]):
    """Delete a split expense (creator or group owner only; blocked if locked by a settlement, D226)."""

    user_id: UserId
    split_id: SplitExpenseId


def delete_split_expense(ctx: Context, command: DeleteSplitExpense) -> None:
    """Remove `split_id` (and cascade its shares & expense links); personal expense rows stay untouched."""
    split, _, _ = require_split_edit_access(ctx.session, command.split_id, command.user_id)
    shares = list(
        ctx.session.exec(select(SplitShare).where(col(SplitShare.split_expense_id) == command.split_id)).all()
    )
    if is_split_locked_by_settlement(ctx.session, split, shares):
        raise BusinessRuleError(translatable(SplitText.SPLIT_LOCKED_BY_SETTLEMENT))
    ctx.session.delete(split)
