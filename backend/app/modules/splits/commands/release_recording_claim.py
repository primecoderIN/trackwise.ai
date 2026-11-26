"""ReleaseRecordingClaim: clear an unfinished `recording` slot after an error (splits command slice, D226)."""

from app.core.cqrs import Command, Context
from app.core.ids import UserId
from app.modules.splits.persistence import repository
from app.modules.splits.values import ExpenseLinkStatus, SplitExpenseId


class ReleaseRecordingClaim(Command[None]):
    """Remove an unfinished `recording` row for `(split_id, owner_id)` so the user can retry cleanly."""

    owner_id: UserId
    split_id: SplitExpenseId


def release_recording_claim(ctx: Context, command: ReleaseRecordingClaim) -> None:
    """Delete the link row only if it is still in `recording` status (never removes a completed link)."""
    link = repository.get_expense_link(ctx.session, command.split_id, command.owner_id)
    if link is not None and link.status == ExpenseLinkStatus.RECORDING.value:
        ctx.session.delete(link)
        ctx.session.flush()
