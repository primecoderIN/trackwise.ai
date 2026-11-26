"""GroupInvites: mints and hashes 256-bit invite tokens around the splits CQRS bus (splits application, D226).

Keeps raw invite tokens out of bus commands, database tables, and logs: tokens are generated here, hashed before
storage, and returned once in CreatedInviteRead (with Cache-Control: no-store).
"""

from dataclasses import dataclass

from app.core.cqrs import MessageBus
from app.modules.splits.commands.accept_group_invite import AcceptGroupInvite
from app.modules.splits.commands.create_group_invite import CreateGroupInvite, NewGroupInvite
from app.modules.splits.domain.rules import hash_invite_token, mint_invite_token
from app.modules.splits.models import CreatedInviteRead, InvitePreviewRead
from app.modules.splits.queries.list_group_invites import ListGroupInvites
from app.modules.splits.queries.preview_group_invite import PreviewGroupInvite


@dataclass(frozen=True)
class GroupInvites:
    """Creates, previews, and accepts hashed shared-group invite links."""

    bus: MessageBus

    def create(self, owner_id: int, group_id: int, new_invite: NewGroupInvite) -> CreatedInviteRead:
        """Mint a new invite token, store its SHA-256 hash, and return the one-time token."""
        raw_token, token_hash, hint = mint_invite_token()
        invite_id = self.bus.execute(
            CreateGroupInvite(
                owner_id=owner_id,
                group_id=group_id,
                invite=new_invite,
                token_hash=token_hash,
                hint=hint,
            )
        )
        invites = self.bus.ask(ListGroupInvites(owner_id=owner_id, group_id=group_id))
        created = next(item for item in invites if item.id == invite_id)
        return CreatedInviteRead(**created.model_dump(), token=raw_token)

    def preview(self, user_id: int, raw_token: str) -> InvitePreviewRead:
        """Hash `raw_token` and return safe group preview metadata."""
        return self.bus.ask(PreviewGroupInvite(user_id=user_id, token_hash=hash_invite_token(raw_token)))

    def accept(
        self,
        user_id: int,
        user_name: str | None,
        raw_token: str,
        claim_member_id: int | None = None,
    ) -> int:
        """Hash `raw_token` and atomically join the group or claim a guest seat, returning `group_id`."""
        return self.bus.execute(
            AcceptGroupInvite(
                user_id=user_id,
                user_name=user_name,
                token_hash=hash_invite_token(raw_token),
                claim_member_id=claim_member_id,
            )
        )
