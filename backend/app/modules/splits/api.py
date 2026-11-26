"""HTTP routes for splits overview, profile, contacts, settlements, and split expenses (splits REST adapter, D226).

Registers ALL static `/splits/*` paths (overview, profile, contacts, groups, invites, settlements) strictly BEFORE
parameterized `/splits/{split_id}` routes so FastAPI never misinterprets static path segments as a split id.
"""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request
from fastapi.exceptions import RequestValidationError

from app.modules.splits.application.invites import GroupInvites
from app.modules.splits.application.record_split import SplitRecorder
from app.modules.splits.commands.create_contact import CreateContact, NewContact
from app.modules.splits.commands.create_split_expense import NewSplitExpense
from app.modules.splits.commands.delete_contact import DeleteContact
from app.modules.splits.commands.delete_split_expense import DeleteSplitExpense
from app.modules.splits.commands.link_split_expense import LinkExpenseInput, LinkSplitExpense
from app.modules.splits.commands.record_settlement import NewSettlement, RecordSettlement
from app.modules.splits.commands.split_input import RecordMyShareInput
from app.modules.splits.commands.unlink_split_expense import UnlinkSplitExpense
from app.modules.splits.commands.update_contact import ContactChanges, UpdateContact
from app.modules.splits.commands.update_split_expense import SplitExpenseChanges, UpdateSplitExpense
from app.modules.splits.commands.update_split_profile import SplitProfileUpdate, UpdateSplitProfile
from app.modules.splits.commands.void_settlement import VoidSettlement
from app.modules.splits.group_api import create_group_router
from app.modules.splits.ledger_models import (
    SavedSplitExpense,
    SettlementList,
    SettlementRead,
    SplitExpenseList,
    SplitExpenseRead,
    SplitsOverviewRead,
)
from app.modules.splits.models import ContactRead, SplitProfileRead
from app.modules.splits.queries.get_contact import GetContact
from app.modules.splits.queries.get_settlement import GetSettlement
from app.modules.splits.queries.get_split_expense import GetSplitExpense
from app.modules.splits.queries.get_split_profile import GetSplitProfile
from app.modules.splits.queries.get_splits_overview import GetSplitsOverview
from app.modules.splits.queries.list_contacts import ListContacts
from app.modules.splits.queries.list_settlements import ListSettlements, SettlementFilters
from app.modules.splits.queries.list_split_expenses import ListSplitExpenses, SplitExpenseFilters
from app.web.auth import CurrentUserDep
from app.web.dependencies import BusDep, IdPath, LanguageDep

TAG = "splits"


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


def create_router(recorder: SplitRecorder, invites: GroupInvites) -> APIRouter:
    """Assemble the splits REST router with static routes registered strictly before `/splits/{split_id}`."""
    router = APIRouter(tags=[TAG])

    # 1. Overview & UPI receive profile (static routes).
    @router.get("/splits/overview", dependencies=[_only_query("include_archived")])
    def get_overview(
        principal: CurrentUserDep,
        bus: BusDep,
        include_archived: Annotated[bool, Query()] = False,
    ) -> SplitsOverviewRead:
        return bus.ask(GetSplitsOverview(user_id=principal.user_id, include_archived=include_archived))

    @router.get("/splits/profile")
    def get_profile(principal: CurrentUserDep, bus: BusDep) -> SplitProfileRead:
        return bus.ask(GetSplitProfile(owner_id=principal.user_id))

    @router.put("/splits/profile")
    def update_profile(body: SplitProfileUpdate, principal: CurrentUserDep, bus: BusDep) -> SplitProfileRead:
        bus.execute(UpdateSplitProfile(owner_id=principal.user_id, profile=body))
        return bus.ask(GetSplitProfile(owner_id=principal.user_id))

    # 2. Private Contacts CRUD (static prefix `/splits/contacts`).
    @router.get("/splits/contacts", dependencies=[_only_query("include_archived")])
    def list_contacts(
        principal: CurrentUserDep,
        bus: BusDep,
        include_archived: Annotated[bool, Query()] = False,
    ) -> list[ContactRead]:
        return bus.ask(ListContacts(owner_id=principal.user_id, include_archived=include_archived))

    @router.post("/splits/contacts", status_code=201)
    def create_contact(body: NewContact, principal: CurrentUserDep, bus: BusDep) -> ContactRead:
        contact_id = bus.execute(CreateContact(owner_id=principal.user_id, contact=body))
        return bus.ask(GetContact(owner_id=principal.user_id, contact_id=contact_id))

    @router.patch("/splits/contacts/{contact_id}")
    def update_contact(contact_id: IdPath, body: ContactChanges, principal: CurrentUserDep, bus: BusDep) -> ContactRead:
        bus.execute(UpdateContact(owner_id=principal.user_id, contact_id=contact_id, changes=body))
        return bus.ask(GetContact(owner_id=principal.user_id, contact_id=contact_id))

    @router.delete("/splits/contacts/{contact_id}", status_code=204)
    def delete_contact(contact_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> None:
        bus.execute(DeleteContact(owner_id=principal.user_id, contact_id=contact_id))

    # 3. Groups & Shared-group Invites (static prefixes `/splits/groups` and `/splits/invites`).
    router.include_router(create_group_router(invites))

    # 4. Settlements (static prefix `/splits/settlements`; soft-void only, never hard-deleted).
    @router.get("/splits/settlements")
    def list_settlements(
        filters: Annotated[SettlementFilters, Query()], principal: CurrentUserDep, bus: BusDep
    ) -> SettlementList:
        return bus.ask(ListSettlements(user_id=principal.user_id, filters=filters))

    @router.post("/splits/settlements", status_code=201)
    def record_settlement(body: NewSettlement, principal: CurrentUserDep, bus: BusDep) -> SettlementRead:
        settlement_input = (
            body
            if "currency" in body.model_fields_set
            else body.model_copy(update={"currency": principal.default_currency})
        )
        settlement_id = bus.execute(RecordSettlement(owner_id=principal.user_id, settlement=settlement_input))
        return bus.ask(GetSettlement(user_id=principal.user_id, settlement_id=settlement_id))

    @router.post("/splits/settlements/{settlement_id}/void")
    def void_settlement(settlement_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> SettlementRead:
        bus.execute(VoidSettlement(user_id=principal.user_id, settlement_id=settlement_id))
        return bus.ask(GetSettlement(user_id=principal.user_id, settlement_id=settlement_id))

    # 5. Split Expenses collection + parameterized `/splits/{split_id}` routes (registered LAST).
    @router.get("/splits")
    def list_splits(
        filters: Annotated[SplitExpenseFilters, Query()], principal: CurrentUserDep, bus: BusDep
    ) -> SplitExpenseList:
        return bus.ask(ListSplitExpenses(user_id=principal.user_id, filters=filters))

    @router.post("/splits", status_code=201)
    def create_split(body: NewSplitExpense, principal: CurrentUserDep, language: LanguageDep) -> SavedSplitExpense:
        split_input = (
            body
            if "currency" in body.model_fields_set
            else body.model_copy(update={"currency": principal.default_currency})
        )
        return recorder.create_split(principal.user_id, split_input, language)

    @router.get("/splits/{split_id}")
    def get_split(split_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> SplitExpenseRead:
        return bus.ask(GetSplitExpense(user_id=principal.user_id, split_id=split_id))

    @router.patch("/splits/{split_id}")
    def update_split(
        split_id: IdPath, body: SplitExpenseChanges, principal: CurrentUserDep, bus: BusDep
    ) -> SplitExpenseRead:
        bus.execute(UpdateSplitExpense(user_id=principal.user_id, split_id=split_id, changes=body))
        return bus.ask(GetSplitExpense(user_id=principal.user_id, split_id=split_id))

    @router.delete("/splits/{split_id}", status_code=204)
    def delete_split(split_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> None:
        bus.execute(DeleteSplitExpense(user_id=principal.user_id, split_id=split_id))

    @router.post("/splits/{split_id}/record-my-share")
    def record_my_share(
        split_id: IdPath, body: RecordMyShareInput, principal: CurrentUserDep, language: LanguageDep
    ) -> SavedSplitExpense:
        return recorder.record_my_share(principal.user_id, split_id, body, language)

    @router.put("/splits/{split_id}/link-expense")
    def link_expense(
        split_id: IdPath, body: LinkExpenseInput, principal: CurrentUserDep, bus: BusDep
    ) -> SplitExpenseRead:
        bus.execute(LinkSplitExpense(owner_id=principal.user_id, split_id=split_id, expense_id=body.expense_id))
        return bus.ask(GetSplitExpense(user_id=principal.user_id, split_id=split_id))

    @router.delete("/splits/{split_id}/link-expense", status_code=204)
    def unlink_expense(split_id: IdPath, principal: CurrentUserDep, bus: BusDep) -> None:
        bus.execute(UnlinkSplitExpense(owner_id=principal.user_id, split_id=split_id))

    return router
