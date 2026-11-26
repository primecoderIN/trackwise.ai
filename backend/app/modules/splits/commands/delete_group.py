"""DeleteGroup: permanently delete an empty group owned by the caller (splits command slice)."""

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_owner
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.values import GroupId


class DeleteGroup(Command[None]):
    """Delete a group with zero splits and zero settlements (owner-only)."""

    owner_id: UserId
    group_id: GroupId


def delete_group(ctx: Context, command: DeleteGroup) -> None:
    """Remove `group_id` only if it has no recorded transactions; otherwise direct the owner to archive it (D226)."""
    group, _ = require_group_owner(ctx.session, command.group_id, command.owner_id)
    if repository.group_has_transactions(ctx.session, command.group_id):
        raise BusinessRuleError(translatable(SplitText.GROUP_IN_USE))
    ctx.session.delete(group)
