"""GetSplitProfile: read the signed-in user's optional UPI receive profile (splits query slice)."""

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.models import SplitProfileRead
from app.modules.splits.persistence import repository


class GetSplitProfile(Query[SplitProfileRead]):
    """Read `owner_id`'s receive-UPI profile (defaults to unset / not shared)."""

    owner_id: UserId


def get_split_profile(ctx: Context, query: GetSplitProfile) -> SplitProfileRead:
    """Fetch `split_profile` for `owner_id` or return default empty settings."""
    row = repository.get_profile(ctx.session, query.owner_id)
    if row is None:
        return SplitProfileRead(upi_id=None, share_upi_with_groups=False)
    return SplitProfileRead(upi_id=row.upi_id, share_upi_with_groups=row.share_upi_with_groups)
