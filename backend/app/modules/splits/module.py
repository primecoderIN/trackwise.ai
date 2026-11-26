"""Composition-root wiring for the splits module: handlers, tables, use cases, and router (only bootstrap.py)."""

from fastapi import APIRouter

from app.core.cqrs import MessageBus
from app.modules.expenses import ExpenseRecorder, SaveWatcher
from app.modules.splits.api import create_router as build_router
from app.modules.splits.application.invites import GroupInvites
from app.modules.splits.application.record_split import SplitRecorder
from app.modules.splits.commands.accept_group_invite import AcceptGroupInvite, accept_group_invite
from app.modules.splits.commands.begin_record_my_share import BeginRecordMyShare, begin_record_my_share
from app.modules.splits.commands.complete_record_my_share import CompleteRecordMyShare, complete_record_my_share
from app.modules.splits.commands.create_contact import CreateContact, create_contact
from app.modules.splits.commands.create_group import CreateGroup, create_group
from app.modules.splits.commands.create_group_invite import CreateGroupInvite, create_group_invite
from app.modules.splits.commands.create_split_expense import CreateSplitExpense, create_split_expense
from app.modules.splits.commands.delete_contact import DeleteContact, delete_contact
from app.modules.splits.commands.delete_group import DeleteGroup, delete_group
from app.modules.splits.commands.delete_split_expense import DeleteSplitExpense, delete_split_expense
from app.modules.splits.commands.leave_group import LeaveGroup, leave_group
from app.modules.splits.commands.link_split_expense import LinkSplitExpense, link_split_expense
from app.modules.splits.commands.record_settlement import RecordSettlement, record_settlement
from app.modules.splits.commands.release_recording_claim import ReleaseRecordingClaim, release_recording_claim
from app.modules.splits.commands.revoke_group_invite import RevokeGroupInvite, revoke_group_invite
from app.modules.splits.commands.transfer_ownership import TransferGroupOwnership, transfer_group_ownership
from app.modules.splits.commands.unlink_split_expense import UnlinkSplitExpense, unlink_split_expense
from app.modules.splits.commands.update_contact import UpdateContact, update_contact
from app.modules.splits.commands.update_group import UpdateGroup, update_group
from app.modules.splits.commands.update_split_expense import UpdateSplitExpense, update_split_expense
from app.modules.splits.commands.update_split_profile import UpdateSplitProfile, update_split_profile
from app.modules.splits.commands.void_settlement import VoidSettlement, void_settlement
from app.modules.splits.persistence.tables import TABLES
from app.modules.splits.queries.get_contact import GetContact, get_contact
from app.modules.splits.queries.get_group_detail import GetGroupDetail, get_group_detail
from app.modules.splits.queries.get_settlement import GetSettlement, get_settlement
from app.modules.splits.queries.get_split_expense import GetSplitExpense, get_split_expense
from app.modules.splits.queries.get_split_profile import GetSplitProfile, get_split_profile
from app.modules.splits.queries.get_splits_overview import GetSplitsOverview, get_splits_overview
from app.modules.splits.queries.list_contacts import ListContacts, list_contacts
from app.modules.splits.queries.list_group_invites import ListGroupInvites, list_group_invites
from app.modules.splits.queries.list_groups import ListGroups, list_groups
from app.modules.splits.queries.list_settlements import ListSettlements, list_settlements
from app.modules.splits.queries.list_split_expenses import ListSplitExpenses, list_split_expenses
from app.modules.splits.queries.preview_group_invite import PreviewGroupInvite, preview_group_invite


def register_handlers(bus: MessageBus) -> None:
    """Register every splits command and query handler on `bus`."""
    bus.register(CreateContact, create_contact)
    bus.register(UpdateContact, update_contact)
    bus.register(DeleteContact, delete_contact)
    bus.register(GetContact, get_contact)
    bus.register(ListContacts, list_contacts)
    bus.register(CreateGroup, create_group)
    bus.register(UpdateGroup, update_group)
    bus.register(DeleteGroup, delete_group)
    bus.register(LeaveGroup, leave_group)
    bus.register(TransferGroupOwnership, transfer_group_ownership)
    bus.register(GetGroupDetail, get_group_detail)
    bus.register(ListGroups, list_groups)
    bus.register(CreateGroupInvite, create_group_invite)
    bus.register(RevokeGroupInvite, revoke_group_invite)
    bus.register(AcceptGroupInvite, accept_group_invite)
    bus.register(PreviewGroupInvite, preview_group_invite)
    bus.register(ListGroupInvites, list_group_invites)
    bus.register(CreateSplitExpense, create_split_expense)
    bus.register(UpdateSplitExpense, update_split_expense)
    bus.register(DeleteSplitExpense, delete_split_expense)
    bus.register(GetSplitExpense, get_split_expense)
    bus.register(ListSplitExpenses, list_split_expenses)
    bus.register(BeginRecordMyShare, begin_record_my_share)
    bus.register(CompleteRecordMyShare, complete_record_my_share)
    bus.register(ReleaseRecordingClaim, release_recording_claim)
    bus.register(LinkSplitExpense, link_split_expense)
    bus.register(UnlinkSplitExpense, unlink_split_expense)
    bus.register(RecordSettlement, record_settlement)
    bus.register(VoidSettlement, void_settlement)
    bus.register(GetSettlement, get_settlement)
    bus.register(ListSettlements, list_settlements)
    bus.register(UpdateSplitProfile, update_split_profile)
    bus.register(GetSplitProfile, get_split_profile)
    bus.register(GetSplitsOverview, get_splits_overview)


def create_router(bus: MessageBus, expense_recorder: ExpenseRecorder, save_watcher: SaveWatcher) -> APIRouter:
    """Build the splits REST router wired to SplitRecorder and GroupInvites."""
    return build_router(SplitRecorder(bus, expense_recorder, save_watcher), GroupInvites(bus))


__all__ = ["TABLES", "create_router", "register_handlers"]
