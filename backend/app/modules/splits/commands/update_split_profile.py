"""UpdateSplitProfile: save or clear the signed-in user's optional UPI ID and group-sharing opt-in (D226)."""

from pydantic import BaseModel, ConfigDict

from app.core.cqrs import Command, Context
from app.core.ids import UserId
from app.modules.splits.domain.rules import validate_upi_id
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitProfile
from app.modules.splits.values import UpiIdInput


# REST body for PUT /splits/profile (no owner_id; server supplies it from session, D190).
class SplitProfileUpdate(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    upi_id: UpiIdInput | None = None
    share_upi_with_groups: bool = False


class UpdateSplitProfile(Command[None]):
    """Upsert `owner_id`'s optional receive-UPI settings."""

    owner_id: UserId
    profile: SplitProfileUpdate


def update_split_profile(ctx: Context, command: UpdateSplitProfile) -> None:
    """Validate UPI VPA syntax (syntax-only, D226) and persist `split_profile`."""
    cleaned_upi = validate_upi_id(command.profile.upi_id)
    now = ctx.clock.now()
    existing = repository.get_profile(ctx.session, command.owner_id)
    if existing is not None:
        existing.upi_id = cleaned_upi
        existing.share_upi_with_groups = command.profile.share_upi_with_groups
        existing.updated_at = now
    else:
        ctx.session.add(
            SplitProfile(
                owner_id=command.owner_id,
                upi_id=cleaned_upi,
                share_upi_with_groups=command.profile.share_upi_with_groups,
                updated_at=now,
            )
        )
    ctx.session.flush()
