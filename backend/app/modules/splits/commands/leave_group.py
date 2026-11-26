"""LeaveGroup: allow a non-owner active member to leave a Shared group once settled (splits command slice, D226)."""

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_member, require_shared_group
from app.modules.splits.domain.balances import member_has_open_balance
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.values import GroupId, MemberRole


class LeaveGroup(Command[None]):
    """Soft-leave a Shared group; owners must transfer ownership first, and balances must be zero."""

    user_id: UserId
    group_id: GroupId


def leave_group(ctx: Context, command: LeaveGroup) -> None:
    """Set `left_at` on the member row (preserving member_id for historical splits and rejoin reactivation)."""
    group, member = require_group_member(ctx.session, command.group_id, command.user_id)
    require_shared_group(group)
    if group.owner_id == command.user_id or member.role == MemberRole.OWNER.value:
        raise BusinessRuleError(translatable(SplitText.OWNER_CANNOT_LEAVE))

    assert member.id is not None
    expenses, settlements = repository.load_group_ledger(ctx.session, command.group_id)
    if member_has_open_balance(expenses, settlements, member.id):
        raise BusinessRuleError(translatable(SplitText.MEMBER_HAS_BALANCE))

    member.left_at = ctx.clock.now()
    ctx.session.flush()
