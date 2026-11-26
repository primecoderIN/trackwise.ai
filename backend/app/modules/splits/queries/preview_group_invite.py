"""PreviewGroupInvite: return minimal safe metadata for a hashed invite link (splits query slice, D226)."""

from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import col, select

from app.core.cqrs import Context, Query
from app.core.errors import NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.modules.splits.i18n import SplitText
from app.modules.splits.models import ClaimableGuestRead, InvitePreviewRead
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitGroup, SplitGroupInvite, SplitGroupMember
from app.modules.splits.values import INVITE_TOKEN_HASH_LENGTH, GroupKind, InviteTokenInput


# REST body for POST /splits/invites/preview (token stays in JSON body, never query string).
class PreviewInviteInput(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    token: InviteTokenInput


class PreviewGroupInvite(Query[InvitePreviewRead]):
    """Preview safe invite metadata without revealing expenses, notes, or UPI IDs."""

    user_id: UserId
    token_hash: str = Field(min_length=INVITE_TOKEN_HASH_LENGTH, max_length=INVITE_TOKEN_HASH_LENGTH)


def preview_group_invite(ctx: Context, query: PreviewGroupInvite) -> InvitePreviewRead:
    """Validate invite usability and list unclaimed guest seats (single generic error on invalid/expired/revoked)."""
    row = ctx.session.exec(
        select(SplitGroupInvite, SplitGroup)
        .join(SplitGroup, col(SplitGroup.id) == col(SplitGroupInvite.group_id))
        .where(col(SplitGroupInvite.token_hash) == query.token_hash)
    ).first()
    if row is None:
        raise NotFoundError(translatable(SplitText.INVITE_INVALID))
    invite, group = row
    if group.kind != GroupKind.SHARED.value or group.archived_at is not None:
        raise NotFoundError(translatable(SplitText.INVITE_INVALID))

    existing = ctx.session.exec(
        select(SplitGroupMember).where(
            col(SplitGroupMember.group_id) == invite.group_id,
            col(SplitGroupMember.user_id) == query.user_id,
        )
    ).first()
    already_member = existing is not None and existing.left_at is None
    is_rejoin = existing is not None and existing.left_at is not None

    now = ctx.clock.now()
    usable = (
        invite.revoked_at is None and repository.utc(invite.expires_at) > now and invite.use_count < invite.max_uses
    )
    if not already_member and not usable:
        raise NotFoundError(translatable(SplitText.INVITE_INVALID))

    members = ctx.session.exec(
        select(SplitGroupMember).where(
            col(SplitGroupMember.group_id) == invite.group_id,
            col(SplitGroupMember.left_at).is_(None),
        )
    ).all()
    guests = [
        ClaimableGuestRead(
            member_id=m.id,
            display_name=m.display_name,
            has_history=repository.member_has_history(ctx.session, m.id),
        )
        for m in sorted(members, key=lambda item: item.display_name.casefold())
        if m.id is not None and m.user_id is None
    ]
    target_guest = None
    if invite.target_member_id is not None:
        target_guest = next((g for g in guests if g.member_id == invite.target_member_id), None)
        if target_guest is None and not already_member:
            raise NotFoundError(translatable(SplitText.INVITE_INVALID))

    return InvitePreviewRead(
        group_name=group.name,
        default_currency=group.default_currency,
        member_count=len(members),
        already_member=already_member,
        is_rejoin=is_rejoin,
        target_guest=target_guest,
        claimable_guests=[] if (already_member or is_rejoin or target_guest is not None) else guests,
    )
