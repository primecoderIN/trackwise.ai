"""TransferGroupOwnership: atomically transfer Shared group ownership to another active registered member (D226)."""

from pydantic import BaseModel, ConfigDict
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_group_owner, require_group_writable, require_shared_group
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence.tables import SplitGroup, SplitGroupMember
from app.modules.splits.values import GroupId, MemberId, MemberRole


# REST body for POST /splits/groups/{group_id}/transfer-ownership.
class TransferOwnershipInput(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    target_member_id: MemberId


class TransferGroupOwnership(Command[None]):
    """Transfer ownership of a Shared group to `target_member_id`, keeping owner_id and role in lockstep."""

    owner_id: UserId
    group_id: GroupId
    target_member_id: MemberId


def transfer_group_ownership(ctx: Context, command: TransferGroupOwnership) -> None:
    """Demote current owner and promote target active registered member in one atomic transaction."""
    group, current_owner = require_group_owner(ctx.session, command.group_id, command.owner_id)
    require_group_writable(group)
    require_shared_group(group)

    target = ctx.session.exec(
        select(SplitGroupMember).where(
            col(SplitGroupMember.id) == command.target_member_id,
            col(SplitGroupMember.group_id) == command.group_id,
            col(SplitGroupMember.left_at).is_(None),
        )
    ).first()
    if target is None or target.user_id is None or target.user_id == command.owner_id:
        raise BusinessRuleError(translatable(SplitText.TRANSFER_TARGET_INVALID))

    conflict = ctx.session.exec(
        select(SplitGroup.id).where(
            col(SplitGroup.owner_id) == target.user_id,
            col(SplitGroup.name_key) == group.name_key,
            col(SplitGroup.id) != command.group_id,
        )
    ).first()
    if conflict is not None:
        raise BusinessRuleError(translatable(SplitText.GROUP_DUPLICATE, name=group.name))

    # Flush demotion first so uq_split_group_member_active_owner never sees two active owners simultaneously.
    current_owner.role = MemberRole.MEMBER.value
    ctx.session.flush()
    target.role = MemberRole.OWNER.value
    group.owner_id = target.user_id
    ctx.session.flush()
