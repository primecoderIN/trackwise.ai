"""GetSplitsOverview: non-netted per-currency totals, groups, context-isolated people, and profile (splits query).

Enforces D226 balance isolation:
- Dashboard totals aggregate directional obligations (`owed_to_you`, `you_owe`) per currency without netting
  unrelated groups.
- People entries list each direct or per-group obligation separately with its context label (never collapsing
  separate group balances into one misleading net figure).
"""

from collections import defaultdict

from sqlmodel import Session, col, desc, select

from app.core.cqrs import Context, Query
from app.core.ids import UserId
from app.modules.splits.domain.balances import (
    LedgerExpense,
    LedgerSettlement,
    SimplifiedTransfer,
    compute_direct_balances,
    compute_overview_totals,
)
from app.modules.splits.ledger_models import SplitsOverviewRead
from app.modules.splits.models import (
    ContactRead,
    ContextObligationRead,
    GroupSummaryRead,
    OverviewCurrencyTotal,
    PersonBalanceRead,
    SplitProfileRead,
)
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import (
    SplitContact,
    SplitExpense,
    SplitGroup,
    SplitGroupMember,
    SplitSettlement,
    SplitShare,
)
from app.modules.splits.queries.read_helpers import (
    build_group_summary,
    load_group_snapshot_and_members,
    member_upi_map,
)
from app.modules.splits.values import BalanceContextKind, BalanceDirection, GroupKind


class GetSplitsOverview(Query[SplitsOverviewRead]):
    """Read the Splits home snapshot for `user_id`."""

    user_id: UserId
    include_archived: bool = False


def _load_direct_balances(session: Session, owner_id: int) -> dict[int, dict[str, int]]:
    """Load `owner_id`'s direct (non-group) splits and settlements and compute per-contact currency balances."""
    expenses = list(
        session.exec(
            select(SplitExpense).where(col(SplitExpense.owner_id) == owner_id, col(SplitExpense.group_id).is_(None))
        ).all()
    )
    split_ids = [exp.id for exp in expenses if exp.id is not None]
    shares_by_split: dict[int, list[tuple[int | None, int]]] = defaultdict(list)
    if split_ids:
        for share in session.exec(select(SplitShare).where(col(SplitShare.split_expense_id).in_(split_ids))).all():
            shares_by_split[share.split_expense_id].append((share.contact_id, share.share_minor))

    ledger_expenses = [
        LedgerExpense(
            currency=exp.currency,
            paid_by=exp.paid_by_contact_id,
            shares=tuple(shares_by_split.get(exp.id, ())),
        )
        for exp in expenses
        if exp.id is not None
    ]
    settlements = session.exec(
        select(SplitSettlement).where(
            col(SplitSettlement.owner_id) == owner_id, col(SplitSettlement.group_id).is_(None)
        )
    ).all()
    ledger_settlements = [
        LedgerSettlement(
            currency=row.currency,
            from_party=row.from_contact_id,
            to_party=row.to_contact_id,
            amount_minor=row.amount_minor,
            voided=row.voided_at is not None,
        )
        for row in settlements
    ]
    return compute_direct_balances(ledger_expenses, ledger_settlements)


def _person_key_for_member(
    group: SplitGroup, other: SplitGroupMember, viewer_id: int
) -> tuple[str, int | None, int | None]:
    """Identify the People-tab grouping key for a group counterparty without leaking another user's private contact."""
    if other.user_id is not None:
        return f"user:{other.user_id}", None, other.user_id
    if group.kind == GroupKind.PERSONAL.value and group.owner_id == viewer_id and other.contact_id is not None:
        return f"contact:{other.contact_id}", other.contact_id, None
    return f"member:{other.id}", None, None


def get_splits_overview(ctx: Context, query: GetSplitsOverview) -> SplitsOverviewRead:
    """Assemble context-isolated balances, active groups, People entries, contacts, and UPI profile."""
    contact_stmt = (
        select(SplitContact).where(col(SplitContact.owner_id) == query.user_id).order_by(col(SplitContact.name_key))
    )
    all_contacts = list(ctx.session.exec(contact_stmt).all())
    visible_contacts = [c for c in all_contacts if query.include_archived or c.archived_at is None]
    contacts_by_id = {c.id: c for c in all_contacts if c.id is not None}

    direct_balances = _load_direct_balances(ctx.session, query.user_id)

    people_meta: dict[str, tuple[str, int | None, int | None, str | None, bool, bool]] = {}
    people_obligations: dict[str, list[ContextObligationRead]] = defaultdict(list)

    for contact in visible_contacts:
        if contact.id is None:
            continue
        key = f"contact:{contact.id}"
        people_meta[key] = (contact.name, contact.id, None, contact.upi_id, True, contact.archived_at is not None)

    for contact_id, by_currency in direct_balances.items():
        contact = contacts_by_id.get(contact_id)
        if contact is None:
            continue
        key = f"contact:{contact_id}"
        people_meta.setdefault(
            key, (contact.name, contact_id, None, contact.upi_id, True, contact.archived_at is not None)
        )
        for currency, net_minor in by_currency.items():
            people_obligations[key].append(
                ContextObligationRead(
                    context_kind=BalanceContextKind.DIRECT,
                    currency=currency,
                    amount_minor=abs(net_minor),
                    direction=BalanceDirection.OWED_TO_YOU if net_minor > 0 else BalanceDirection.YOU_OWE,
                )
            )

    group_stmt = (
        select(SplitGroup, SplitGroupMember)
        .join(SplitGroupMember, col(SplitGroupMember.group_id) == col(SplitGroup.id))
        .where(col(SplitGroupMember.user_id) == query.user_id, col(SplitGroupMember.left_at).is_(None))
        .order_by(desc(col(SplitGroup.created_at)), desc(col(SplitGroup.id)))
    )
    if not query.include_archived:
        group_stmt = group_stmt.where(col(SplitGroup.archived_at).is_(None))

    group_summaries: list[GroupSummaryRead] = []
    all_group_transfers: list[tuple[int, SimplifiedTransfer]] = []

    for group, my_member in ctx.session.exec(group_stmt).all():
        if group.id is None or my_member.id is None:
            continue
        if group.kind == GroupKind.PERSONAL.value and group.owner_id != query.user_id:
            continue
        members, snapshot = load_group_snapshot_and_members(ctx.session, group.id)
        group_summaries.append(build_group_summary(group, my_member, members, snapshot))
        members_by_id = {m.id: m for m in members if m.id is not None}
        upis = member_upi_map(ctx.session, group, members, query.user_id)

        for transfer in snapshot.transfers:
            if transfer.to_member_id == my_member.id:
                other_id = transfer.from_member_id
                direction = BalanceDirection.OWED_TO_YOU
            elif transfer.from_member_id == my_member.id:
                other_id = transfer.to_member_id
                direction = BalanceDirection.YOU_OWE
            else:
                continue
            all_group_transfers.append((my_member.id, transfer))
            other = members_by_id.get(other_id)
            if other is None:
                continue
            key, cid, uid = _person_key_for_member(group, other, query.user_id)
            if key not in people_meta:
                people_meta[key] = (other.display_name, cid, uid, upis.get(other_id), cid is not None, False)
            people_obligations[key].append(
                ContextObligationRead(
                    context_kind=BalanceContextKind.GROUP,
                    group_id=group.id,
                    group_name=group.name,
                    group_kind=GroupKind(group.kind),
                    member_id=other_id,
                    currency=transfer.currency,
                    amount_minor=transfer.amount_minor,
                    direction=direction,
                )
            )

    totals = [
        OverviewCurrencyTotal(
            currency=item.currency,
            owed_to_you_minor=item.owed_to_you_minor,
            you_owe_minor=item.you_owe_minor,
        )
        for item in compute_overview_totals(direct_balances, all_group_transfers)
    ]

    people = [
        PersonBalanceRead(
            key=key,
            display_name=meta[0],
            contact_id=meta[1],
            user_id=meta[2],
            upi_id=meta[3],
            is_contact=meta[4],
            archived=meta[5],
            obligations=people_obligations.get(key, []),
        )
        for key, meta in sorted(
            people_meta.items(), key=lambda item: (not bool(people_obligations.get(item[0])), item[1][0].casefold())
        )
    ]

    profile_row = repository.get_profile(ctx.session, query.user_id)
    profile = SplitProfileRead(
        upi_id=profile_row.upi_id if profile_row else None,
        share_upi_with_groups=profile_row.share_upi_with_groups if profile_row else False,
    )
    return SplitsOverviewRead(
        totals=totals,
        groups=group_summaries,
        people=people,
        contacts=[ContactRead.model_validate(c) for c in visible_contacts],
        profile=profile,
    )
