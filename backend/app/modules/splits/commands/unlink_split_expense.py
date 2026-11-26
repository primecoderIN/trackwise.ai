"""UnlinkSplitExpense: remove the caller's private expense link from a split (splits command slice, D190)."""

from app.core.cqrs import Command, Context
from app.core.errors import NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_split_access
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.values import SplitExpenseId


class UnlinkSplitExpense(Command[None]):
    """Detach `owner_id`'s personal expense link from `split_id` without deleting the personal expense itself."""

    owner_id: UserId
    split_id: SplitExpenseId


def unlink_split_expense(ctx: Context, command: UnlinkSplitExpense) -> None:
    """Delete the caller's `split_expense_link` row (404 if absent or split not accessible)."""
    require_split_access(ctx.session, command.split_id, command.owner_id)
    link = repository.get_expense_link(ctx.session, command.split_id, command.owner_id)
    if link is None:
        raise NotFoundError(translatable(SplitText.EXPENSE_LINK_NOT_FOUND))
    ctx.session.delete(link)
