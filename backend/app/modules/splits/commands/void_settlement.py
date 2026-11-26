"""VoidSettlement: soft-void a recorded settlement while keeping an audit trail (splits command slice, D226)."""

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.domain.access import require_settlement_void_access
from app.modules.splits.i18n import SplitText
from app.modules.splits.values import SettlementId


class VoidSettlement(Command[None]):
    """Soft-void `settlement_id` (creator or group owner only); balances recalculate immediately."""

    user_id: UserId
    settlement_id: SettlementId


def void_settlement(ctx: Context, command: VoidSettlement) -> None:
    """Mark `voided_at` and `voided_by_user_id` on `settlement_id` instead of hard-deleting it."""
    settlement, _ = require_settlement_void_access(ctx.session, command.settlement_id, command.user_id)
    if settlement.voided_at is not None:
        raise BusinessRuleError(translatable(SplitText.SETTLEMENT_ALREADY_VOIDED))
    settlement.voided_at = ctx.clock.now()
    settlement.voided_by_user_id = command.user_id
    ctx.session.flush()
