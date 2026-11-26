"""HTTP routes for split groups, membership lifecycle, and shared-group invites (splits REST adapter, D226).

Mounted inside splits/api.py strictly BEFORE parameterized `/splits/{split_id}` routes so static paths like
`/splits/groups` and `/splits/invites/preview` are never shadowed. Every route acts for `principal.user_id`.
Notes are `#` comments so route docstrings stay clean in OpenAPI.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ConfigDict

from app.core.errors import NotFoundError
from app.modules.splits.application.invites import GroupInvites
from app.modules.splits.commands.accept_group_invite import AcceptInviteInput
from app.modules.splits.commands.create_group import CreateGroup, NewGroup
from app.modules.splits.commands.create_group_invite import NewGroupInvite
from app.modules.splits.commands.delete_group import DeleteGroup
from app.modules.splits.commands.leave_group import LeaveGroup
from app.modules.splits.commands.revoke_group_invite import RevokeGroupInvite
from app.modules.splits.commands.transfer_ownership import TransferGroupOwnership, TransferOwnershipInput
from app.modules.splits.commands.update_group import GroupChanges, UpdateGroup
from app.modules.splits.ledger_models import GroupDetailRead
from app.modules.splits.models import CreatedInviteRead, GroupSummaryRead, InvitePreviewRead, InviteRead
from app.modules.splits.queries.get_group_detail import GetGroupDetail
from app.modules.splits.queries.list_group_invites import ListGroupInvites
from app.modules.splits.queries.list_groups import ListGroups
from app.modules.splits.queries.preview_group_invite import PreviewInviteInput
from app.web.auth import CurrentUserDep
from app.web.dependencies import BusDep, IdPath
from app.web.rate_limits import INVITE_QUOTA, record_invalid_invite_attempt


# Answer for POST /splits/invites/accept: the joined group's id for client navigation.
class AcceptedInviteRead(BaseModel):
    model_config = ConfigDict(frozen=True)

    group_id: int


def _only_query(*allowed: str) -> Any:
    """Refuse unexpected query parameters with a 422 validation problem."""
    allowed_set = frozenset(allowed)

    def check(request: Request) -> None:
        unexpected = [name for name in request.query_params if name not in allowed_set]
        if unexpected:
            raise RequestValidationError(
                [
                    {"type": "extra_forbidden", "loc": ("query", name), "msg": "Extra inputs are not permitted"}
                    for name in unexpected
                ]
            )

    return Depends(check)


def create_group_router(invites: GroupInvites) -> APIRouter:
    """Build the groups and invites sub-router around `invites`."""
    router = APIRouter()

    # GET /api/v1/splits/groups: Personal and Shared groups the caller actively belongs to.
    @router.get("/splits/groups", dependencies=[_only_query("include_archived")])
    def list_groups(
        principal: CurrentUserDep,
        bus: BusDep,
        include_archived: Annotated[bool, Query()] = False,
    ) -> list[GroupSummaryRead]:
        return bus.ask(ListGroups(user_id=principal.user_id, include_archived=include_archived))

    # POST /api/v1/splits/groups: create a Personal or Shared group and return its detail view.
    @router.post("/splits/groups", status_code=201)
    def create_group(body: NewGroup, principal: CurrentUserDep, bus: BusDep) -> GroupDetailRead:
        group_id = bus.execute(CreateGroup(owner_id=principal.user_id, owner_name=principal.display_name, group=body))
        return bus.ask(GetGroupDetail(user_id=principal.user_id, group_id=group_id))

    # GET /api/v1/splits/groups/{group_id}: members, balances, simplified transfers, invites (owner), splits, ledger.
    @router.get("/splits/groups/{group_id}")
    def get_group_detail(group_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> GroupDetailRead:
        return bus.ask(GetGroupDetail(user_id=principal.user_id, group_id=group_id))

    # PATCH /api/v1/splits/groups/{group_id}: owner-only rename, currency, Shared upgrade, member edits, archive.
    @router.patch("/splits/groups/{group_id}")
    def update_group(group_id: IdPath, body: GroupChanges, principal: CurrentUserDep, bus: BusDep) -> GroupDetailRead:
        bus.execute(UpdateGroup(owner_id=principal.user_id, group_id=group_id, changes=body))
        return bus.ask(GetGroupDetail(user_id=principal.user_id, group_id=group_id))

    # DELETE /api/v1/splits/groups/{group_id}: owner-only delete when zero splits and zero settlements exist.
    @router.delete("/splits/groups/{group_id}", status_code=204)
    def delete_group(group_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> None:
        bus.execute(DeleteGroup(owner_id=principal.user_id, group_id=group_id))

    # POST /api/v1/splits/groups/{group_id}/leave: non-owner active member leaves once balance is 0 across currencies.
    @router.post("/splits/groups/{group_id}/leave", status_code=204)
    def leave_group(group_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> None:
        bus.execute(LeaveGroup(user_id=principal.user_id, group_id=group_id))

    # POST /api/v1/splits/groups/{group_id}/transfer-ownership: owner transfers group ownership to an active member.
    @router.post("/splits/groups/{group_id}/transfer-ownership")
    def transfer_ownership(
        group_id: IdPath, body: TransferOwnershipInput, principal: CurrentUserDep, bus: BusDep
    ) -> GroupDetailRead:
        bus.execute(
            TransferGroupOwnership(
                owner_id=principal.user_id, group_id=group_id, target_member_id=body.target_member_id
            )
        )
        return bus.ask(GetGroupDetail(user_id=principal.user_id, group_id=group_id))

    # GET /api/v1/splits/groups/{group_id}/invites: owner-only invite audit list (never exposes raw tokens).
    @router.get("/splits/groups/{group_id}/invites")
    def list_invites(group_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> list[InviteRead]:
        return bus.ask(ListGroupInvites(owner_id=principal.user_id, group_id=group_id))

    # POST /api/v1/splits/groups/{group_id}/invites: owner-only invite link creation; raw token returned once.
    @router.post("/splits/groups/{group_id}/invites", status_code=201)
    def create_invite(group_id: IdPath, body: NewGroupInvite, principal: CurrentUserDep) -> CreatedInviteRead:
        return invites.create(principal.user_id, group_id, body)

    # DELETE /api/v1/splits/groups/{group_id}/invites/{invite_id}: owner-only soft-revoke.
    @router.delete("/splits/groups/{group_id}/invites/{invite_id}", status_code=204)
    def revoke_invite(group_id: IdPath, invite_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> None:
        bus.execute(RevokeGroupInvite(owner_id=principal.user_id, group_id=group_id, invite_id=invite_id))

    # POST /api/v1/splits/invites/preview: rate-limited safe invite metadata preview (token in JSON body only).
    @router.post("/splits/invites/preview", dependencies=[INVITE_QUOTA])
    def preview_invite(body: PreviewInviteInput, principal: CurrentUserDep, request: Request) -> InvitePreviewRead:
        try:
            return invites.preview(principal.user_id, body.token)
        except NotFoundError:
            record_invalid_invite_attempt(request, principal.user_id)
            raise

    # POST /api/v1/splits/invites/accept: atomic, idempotent invite acceptance, rejoin restore, and guest-seat claim.
    @router.post("/splits/invites/accept", dependencies=[INVITE_QUOTA])
    def accept_invite(body: AcceptInviteInput, principal: CurrentUserDep, request: Request) -> AcceptedInviteRead:
        try:
            group_id = invites.accept(principal.user_id, principal.display_name, body.token, body.claim_member_id)
        except NotFoundError:
            record_invalid_invite_attempt(request, principal.user_id)
            raise
        return AcceptedInviteRead(group_id=group_id)

    return router
