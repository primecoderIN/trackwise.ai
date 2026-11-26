"""BeginRecordMyShare: atomically claim the caller's personal-expense recording slot (splits command slice, D226)."""

from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules import categories
from app.modules.categories import CategoryId
from app.modules.splits.domain.access import require_split_access
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitExpenseLink, SplitShare
from app.modules.splits.values import ExpenseLinkStatus, SplitExpenseId


class BeginRecordMyShare(Command[int | None]):
    """Claim `(split_id, owner_id)` in status='recording'. Returns existing expense_id if already linked (idempotent),
    or None when a fresh recording slot was claimed."""

    owner_id: UserId
    split_id: SplitExpenseId
    category_id: CategoryId


def begin_record_my_share(ctx: Context, command: BeginRecordMyShare) -> int | None:
    """Enforce idempotency, validate access/share/category, and insert a `recording` claim row."""
    split, _, my_member = require_split_access(ctx.session, command.split_id, command.owner_id)
    if ctx.bus.ask(categories.GetCategory(category_id=command.category_id)) is None:
        raise BusinessRuleError(translatable(SplitText.CATEGORY_NOT_FOUND, category_id=command.category_id))

    existing = repository.get_expense_link(ctx.session, command.split_id, command.owner_id)
    if existing is not None:
        if existing.status == ExpenseLinkStatus.LINKED.value and existing.expense_id is not None:
            return existing.expense_id
        raise BusinessRuleError(translatable(SplitText.RECORDING_IN_PROGRESS))

    shares = ctx.session.exec(select(SplitShare).where(col(SplitShare.split_expense_id) == command.split_id)).all()
    if split.group_id is not None and my_member is not None:
        my_share_minor = next((row.share_minor for row in shares if row.member_id == my_member.id), 0)
    else:
        my_share_minor = next((row.share_minor for row in shares if row.contact_id is None), 0)
    if my_share_minor <= 0:
        raise BusinessRuleError(translatable(SplitText.NO_SELF_SHARE))

    now = ctx.clock.now()
    ctx.session.add(
        SplitExpenseLink(
            split_expense_id=command.split_id,
            owner_id=command.owner_id,
            expense_id=None,
            status=ExpenseLinkStatus.RECORDING.value,
            created_at=now,
            updated_at=now,
        )
    )
    try:
        ctx.session.flush()
    except IntegrityError as exc:
        raise BusinessRuleError(translatable(SplitText.RECORDING_IN_PROGRESS)) from exc
    return None
