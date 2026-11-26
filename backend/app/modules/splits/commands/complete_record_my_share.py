"""CompleteRecordMyShare: finalize a recording claim with the newly created personal expense id (splits command)."""

from app.core.cqrs import Command, Context
from app.core.errors import NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.expenses import ExpenseId
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.values import ExpenseLinkStatus, SplitExpenseId


class CompleteRecordMyShare(Command[None]):
    """Transition `(split_id, owner_id)` from `recording` to `linked` with `expense_id`."""

    owner_id: UserId
    split_id: SplitExpenseId
    expense_id: ExpenseId


def complete_record_my_share(ctx: Context, command: CompleteRecordMyShare) -> None:
    """Attach the created personal `expense_id` to the caller's recording claim."""
    link = repository.get_expense_link(ctx.session, command.split_id, command.owner_id)
    if link is None:
        raise NotFoundError(translatable(SplitText.EXPENSE_LINK_NOT_FOUND))
    link.expense_id = command.expense_id
    link.status = ExpenseLinkStatus.LINKED.value
    link.updated_at = ctx.clock.now()
    ctx.session.flush()
