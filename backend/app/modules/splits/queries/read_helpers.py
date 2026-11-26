"""Shared read-model projection helpers used across splits query slices (splits queries).

Keeps DTO building in one place while strictly enforcing D226 privacy rules:
- Shared-group DTOs never expose private `contact_id`, contact notes, or `split_contact.upi_id`.
- Registered co-members' UPI IDs appear ONLY when `split_profile.share_upi_with_groups` is True.
- SplitExpenseRead carries ONLY the caller's own `split_expense_link` (never another user's expense_id).
"""

from collections.abc import Sequence

from sqlmodel import Session, col, select

from app.modules.splits.domain.access import can_edit_split, can_void_settlement, is_split_locked_by_settlement
from app.modules.splits.domain.balances import GroupBalanceSnapshot, compute_group_snapshot
from app.modules.splits.ledger_models import SettlementRead, SplitExpenseRead, SplitShareRead
from app.modules.splits.models import (
    CurrencyBalance,
    GroupMemberRead,
    GroupSummaryRead,
    MemberCurrencyBalanceRead,
    SimplifiedTransferRead,
)
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import (
    SplitContact,
    SplitExpense,
    SplitExpenseLink,
    SplitGroup,
    SplitGroupMember,
    SplitSettlement,
    SplitShare,
)
from app.modules.splits.values import BalanceDirection, ExpenseLinkStatus, GroupKind, MemberRole, SplitMethod

SELF_LABEL = "You"


def member_upi_map(
    session: Session, group: SplitGroup, members: Sequence[SplitGroupMember], viewer_id: int
) -> dict[int, str | None]:
    """Resolve safe `member_id -> upi_id` respecting opt-in shared-group privacy and personal-group ownership."""
    user_ids = [m.user_id for m in members if m.user_id is not None]
    shared_upis = repository.shared_upi_by_user(session, user_ids)
    own_profile = repository.get_profile(session, viewer_id)
    contact_upis: dict[int, str | None] = {}
    if group.kind == GroupKind.PERSONAL.value and group.owner_id == viewer_id:
        contact_ids = [m.contact_id for m in members if m.contact_id is not None]
        contacts = repository.get_contacts_by_ids(session, viewer_id, contact_ids)
        contact_upis = {cid: c.upi_id for cid, c in contacts.items()}

    result: dict[int, str | None] = {}
    for member in members:
        if member.id is None:
            continue
        if member.user_id == viewer_id:
            result[member.id] = own_profile.upi_id if own_profile else None
        elif member.user_id is not None:
            result[member.id] = shared_upis.get(member.user_id)
        elif group.kind == GroupKind.PERSONAL.value and member.contact_id is not None:
            result[member.id] = contact_upis.get(member.contact_id)
        else:
            result[member.id] = None
    return result


def build_group_members(
    members: Sequence[SplitGroupMember], viewer_id: int, upis: dict[int, str | None]
) -> list[GroupMemberRead]:
    """Convert table rows into privacy-safe GroupMemberRead DTOs (active members first)."""
    ordered = sorted(
        members, key=lambda m: (m.left_at is not None, m.role != MemberRole.OWNER.value, m.display_name.casefold())
    )
    return [
        GroupMemberRead(
            id=m.id,
            display_name=m.display_name,
            role=MemberRole(m.role),
            is_self=m.user_id == viewer_id,
            is_registered=m.user_id is not None,
            is_active=m.left_at is None,
            upi_id=upis.get(m.id),
            joined_at=repository.utc(m.joined_at),
            left_at=repository.utc(m.left_at) if m.left_at is not None else None,
        )
        for m in ordered
        if m.id is not None
    ]


def build_group_summary(
    group: SplitGroup,
    my_member: SplitGroupMember,
    members: Sequence[SplitGroupMember],
    snapshot: GroupBalanceSnapshot,
) -> GroupSummaryRead:
    """Project a group and the caller's own per-currency net balances inside that group."""
    assert group.id is not None and my_member.id is not None
    active_count = sum(1 for m in members if m.left_at is None)
    my_balances: list[CurrencyBalance] = []
    for currency, nets in sorted(snapshot.member_nets.items()):
        net = nets.get(my_member.id, 0)
        if net > 0:
            my_balances.append(
                CurrencyBalance(currency=currency, amount_minor=net, direction=BalanceDirection.OWED_TO_YOU)
            )
        elif net < 0:
            my_balances.append(
                CurrencyBalance(currency=currency, amount_minor=-net, direction=BalanceDirection.YOU_OWE)
            )
    return GroupSummaryRead(
        id=group.id,
        kind=GroupKind(group.kind),
        name=group.name,
        default_currency=group.default_currency,
        my_role=MemberRole(my_member.role),
        my_member_id=my_member.id,
        member_count=active_count,
        archived_at=repository.utc(group.archived_at) if group.archived_at is not None else None,
        created_at=repository.utc(group.created_at),
        my_balances=my_balances,
    )


def build_group_balances_and_transfers(
    snapshot: GroupBalanceSnapshot,
    member_by_id: dict[int, SplitGroupMember],
    viewer_id: int,
    upis: dict[int, str | None],
) -> tuple[list[MemberCurrencyBalanceRead], list[SimplifiedTransferRead]]:
    """Build per-member balances and simplified settlement suggestions for one group."""
    member_balances: list[MemberCurrencyBalanceRead] = []
    for currency, nets in sorted(snapshot.member_nets.items()):
        for member_id, net_minor in sorted(nets.items(), key=lambda item: (-item[1], item[0])):
            member = member_by_id.get(member_id)
            if member is None:
                continue
            member_balances.append(
                MemberCurrencyBalanceRead(
                    member_id=member_id,
                    display_name=member.display_name,
                    is_self=member.user_id == viewer_id,
                    currency=currency,
                    net_minor=net_minor,
                )
            )

    transfers: list[SimplifiedTransferRead] = []
    for transfer in snapshot.transfers:
        sender = member_by_id.get(transfer.from_member_id)
        receiver = member_by_id.get(transfer.to_member_id)
        if sender is None or receiver is None:
            continue
        transfers.append(
            SimplifiedTransferRead(
                from_member_id=transfer.from_member_id,
                from_name=sender.display_name,
                from_is_self=sender.user_id == viewer_id,
                to_member_id=transfer.to_member_id,
                to_name=receiver.display_name,
                to_is_self=receiver.user_id == viewer_id,
                to_upi_id=upis.get(transfer.to_member_id),
                currency=transfer.currency,
                amount_minor=transfer.amount_minor,
            )
        )
    return member_balances, transfers


def build_split_read(
    session: Session,
    split: SplitExpense,
    *,
    viewer_id: int,
    group: SplitGroup | None,
    my_member: SplitGroupMember | None,
    members_by_id: dict[int, SplitGroupMember],
    contacts_by_id: dict[int, SplitContact],
    shares: Sequence[SplitShare],
    my_link: SplitExpenseLink | None,
) -> SplitExpenseRead:
    """Build one SplitExpenseRead carrying only `viewer_id`'s private link and accurate permissions."""
    assert split.id is not None
    share_reads: list[SplitShareRead] = []
    my_share_minor = 0

    if split.group_id is not None:
        payer_member = members_by_id.get(split.paid_by_member_id) if split.paid_by_member_id else None
        paid_by_is_self = payer_member is not None and payer_member.user_id == viewer_id
        paid_by_name = payer_member.display_name if payer_member else SELF_LABEL
        for share in shares:
            member = members_by_id.get(share.member_id) if share.member_id else None
            is_self = my_member is not None and share.member_id == my_member.id
            if is_self:
                my_share_minor = share.share_minor
            share_reads.append(
                SplitShareRead(
                    member_id=share.member_id,
                    contact_id=None,
                    is_self=is_self,
                    display_name=member.display_name if member else SELF_LABEL,
                    share_minor=share.share_minor,
                    currency=split.currency,
                )
            )
    else:
        payer_contact = contacts_by_id.get(split.paid_by_contact_id) if split.paid_by_contact_id else None
        paid_by_is_self = split.paid_by_contact_id is None
        paid_by_name = SELF_LABEL if paid_by_is_self else (payer_contact.name if payer_contact else SELF_LABEL)
        for share in shares:
            is_self = share.contact_id is None
            if is_self:
                my_share_minor = share.share_minor
            contact = contacts_by_id.get(share.contact_id) if share.contact_id else None
            share_reads.append(
                SplitShareRead(
                    member_id=None,
                    contact_id=share.contact_id,
                    is_self=is_self,
                    display_name=SELF_LABEL if is_self else (contact.name if contact else SELF_LABEL),
                    share_minor=share.share_minor,
                    currency=split.currency,
                )
            )

    locked = is_split_locked_by_settlement(session, split, shares)
    return SplitExpenseRead(
        id=split.id,
        group_id=split.group_id,
        group_name=group.name if group else None,
        group_kind=GroupKind(group.kind) if group else None,
        description=split.description,
        amount_minor=split.amount_minor,
        currency=split.currency,
        split_method=SplitMethod(split.split_method),
        spent_on=split.spent_on,
        note=split.note,
        paid_by_member_id=split.paid_by_member_id,
        paid_by_contact_id=split.paid_by_contact_id,
        paid_by_is_self=paid_by_is_self,
        paid_by_name=paid_by_name,
        shares=share_reads,
        my_share_minor=my_share_minor,
        my_linked_expense_id=my_link.expense_id if my_link else None,
        my_link_status=ExpenseLinkStatus(my_link.status) if my_link else None,
        can_edit=can_edit_split(split, group, viewer_id) and (group is None or group.archived_at is None),
        locked_by_settlement=locked,
        created_at=repository.utc(split.created_at),
    )


def build_settlement_read(
    row: SplitSettlement,
    *,
    viewer_id: int,
    group: SplitGroup | None,
    members_by_id: dict[int, SplitGroupMember],
    contacts_by_id: dict[int, SplitContact],
) -> SettlementRead:
    """Build one SettlementRead with resolved participant names and soft-void permissions."""
    assert row.id is not None
    if row.group_id is not None:
        sender = members_by_id.get(row.from_member_id) if row.from_member_id else None
        receiver = members_by_id.get(row.to_member_id) if row.to_member_id else None
        from_is_self = sender is not None and sender.user_id == viewer_id
        to_is_self = receiver is not None and receiver.user_id == viewer_id
        from_name = sender.display_name if sender else SELF_LABEL
        to_name = receiver.display_name if receiver else SELF_LABEL
    else:
        from_contact = contacts_by_id.get(row.from_contact_id) if row.from_contact_id else None
        to_contact = contacts_by_id.get(row.to_contact_id) if row.to_contact_id else None
        from_is_self = row.from_contact_id is None
        to_is_self = row.to_contact_id is None
        from_name = SELF_LABEL if from_is_self else (from_contact.name if from_contact else SELF_LABEL)
        to_name = SELF_LABEL if to_is_self else (to_contact.name if to_contact else SELF_LABEL)

    return SettlementRead(
        id=row.id,
        group_id=row.group_id,
        group_name=group.name if group else None,
        from_member_id=row.from_member_id,
        from_contact_id=row.from_contact_id,
        from_is_self=from_is_self,
        from_name=from_name,
        to_member_id=row.to_member_id,
        to_contact_id=row.to_contact_id,
        to_is_self=to_is_self,
        to_name=to_name,
        amount_minor=row.amount_minor,
        currency=row.currency,
        settled_on=row.settled_on,
        note=row.note,
        voided_at=repository.utc(row.voided_at) if row.voided_at is not None else None,
        can_void=(
            row.voided_at is None
            and can_void_settlement(row, group, viewer_id)
            and (group is None or group.archived_at is None)
        ),
        created_at=repository.utc(row.created_at),
    )


def load_group_snapshot_and_members(
    session: Session, group_id: int
) -> tuple[list[SplitGroupMember], GroupBalanceSnapshot]:
    """Load all members (active and former) and the computed balance snapshot for `group_id`."""
    members = list(session.exec(select(SplitGroupMember).where(col(SplitGroupMember.group_id) == group_id)).all())
    expenses, settlements = repository.load_group_ledger(session, group_id)
    return members, compute_group_snapshot(expenses, settlements)
