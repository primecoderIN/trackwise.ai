"""LinkSplitExpense: privately link an existing personal expense to a split (splits command slice, D190, D226)."""

from pydantic import BaseModel, ConfigDict

from app.core.cqrs import Command, Context
from app.core.errors import NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules import expenses
from app.modules.splits.domain.access import require_split_access
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitExpenseLink
from app.modules.splits.values import ExpenseLinkStatus, SplitExpenseId


# REST body for PUT /splits/{split_id}/link-expense.
class LinkExpenseInput(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    expense_id: expenses.ExpenseId


class LinkSplitExpense(Command[None]):
    """Attach `owner_id`'s existing personal expense to `split_id` (also recovers an interrupted `recording` state)."""

    owner_id: UserId
    split_id: SplitExpenseId
    expense_id: expenses.ExpenseId


def link_split_expense(ctx: Context, command: LinkSplitExpense) -> None:
    """Validate access to both the split and the personal expense, then upsert the caller's private link."""
    require_split_access(ctx.session, command.split_id, command.owner_id)
    try:
        ctx.bus.ask(expenses.GetExpense(owner_id=command.owner_id, expense_id=command.expense_id))
    except NotFoundError as exc:
        raise NotFoundError(translatable(SplitText.LINKED_EXPENSE_NOT_FOUND)) from exc

    now = ctx.clock.now()
    existing = repository.get_expense_link(ctx.session, command.split_id, command.owner_id)
    if existing is not None:
        existing.expense_id = command.expense_id
        existing.status = ExpenseLinkStatus.LINKED.value
        existing.updated_at = now
    else:
        ctx.session.add(
            SplitExpenseLink(
                split_expense_id=command.split_id,
                owner_id=command.owner_id,
                expense_id=command.expense_id,
                status=ExpenseLinkStatus.LINKED.value,
                created_at=now,
                updated_at=now,
            )
        )
    ctx.session.flush()
