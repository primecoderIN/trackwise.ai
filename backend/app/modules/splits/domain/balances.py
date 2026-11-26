"""Pure balance calculation and min-cash-flow debt simplification (splits domain, D226).

Zero database dependencies so every calculation is deterministic and trivially testable:
- Group balances and simplified transfers are computed strictly per group and per currency.
- Direct balances are computed strictly per contact and per currency.
- Overview totals aggregate directional sums per currency WITHOUT netting across unrelated groups (D226).
- Soft-voided settlements (`voided=True`) are excluded from all balance calculations.
"""

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass


@dataclass(frozen=True)
class LedgerExpense:
    """Minimal projection of a split expense for balance math (key is member_id for groups, contact_id|None direct)."""

    currency: str
    paid_by: int | None
    shares: tuple[tuple[int | None, int], ...]


@dataclass(frozen=True)
class LedgerSettlement:
    """Minimal projection of a settlement for balance math."""

    currency: str
    from_party: int | None
    to_party: int | None
    amount_minor: int
    voided: bool = False


@dataclass(frozen=True)
class SimplifiedTransfer:
    """One minimum-cash-flow transfer clearing debt inside a single group and currency."""

    currency: str
    from_member_id: int
    to_member_id: int
    amount_minor: int


@dataclass(frozen=True)
class GroupBalanceSnapshot:
    """Per-currency member nets (+ owed money, - owes money) and simplified transfers for one group."""

    member_nets: dict[str, dict[int, int]]
    transfers: list[SimplifiedTransfer]


@dataclass(frozen=True)
class CurrencyTotals:
    """Non-netted directional overview totals for one currency (D226)."""

    currency: str
    owed_to_you_minor: int
    you_owe_minor: int


def compute_group_snapshot(
    expenses: Iterable[LedgerExpense],
    settlements: Iterable[LedgerSettlement],
) -> GroupBalanceSnapshot:
    """Compute per-currency member net balances and simplified minimum transfers for one group."""
    nets_by_currency: dict[str, dict[int, int]] = defaultdict(lambda: defaultdict(int))
    for expense in expenses:
        if expense.paid_by is None:
            continue
        nets = nets_by_currency[expense.currency]
        for participant, share_minor in expense.shares:
            if participant is None or share_minor == 0:
                continue
            nets[expense.paid_by] += share_minor
            nets[participant] -= share_minor

    for settlement in settlements:
        if settlement.voided or settlement.from_party is None or settlement.to_party is None:
            continue
        nets = nets_by_currency[settlement.currency]
        # Payer reduced their debt (+amount); receiver collected payment (-amount).
        nets[settlement.from_party] += settlement.amount_minor
        nets[settlement.to_party] -= settlement.amount_minor

    cleaned: dict[str, dict[int, int]] = {}
    transfers: list[SimplifiedTransfer] = []
    for currency in sorted(nets_by_currency):
        non_zero = {member_id: net for member_id, net in nets_by_currency[currency].items() if net != 0}
        if not non_zero:
            continue
        cleaned[currency] = non_zero
        transfers.extend(_simplify_currency(currency, non_zero))
    return GroupBalanceSnapshot(member_nets=cleaned, transfers=transfers)


def _simplify_currency(currency: str, nets: dict[int, int]) -> list[SimplifiedTransfer]:
    """Greedy largest-debtor to largest-creditor matching; guarantees deterministic minimal transfers."""
    creditors = [[member_id, net] for member_id, net in nets.items() if net > 0]
    debtors = [[member_id, -net] for member_id, net in nets.items() if net < 0]
    transfers: list[SimplifiedTransfer] = []

    while creditors and debtors:
        creditors.sort(key=lambda item: (-item[1], item[0]))
        debtors.sort(key=lambda item: (-item[1], item[0]))
        creditor = creditors[0]
        debtor = debtors[0]
        amount = min(creditor[1], debtor[1])
        transfers.append(
            SimplifiedTransfer(
                currency=currency,
                from_member_id=debtor[0],
                to_member_id=creditor[0],
                amount_minor=amount,
            )
        )
        creditor[1] -= amount
        debtor[1] -= amount
        if creditor[1] == 0:
            creditors.pop(0)
        if debtor[1] == 0:
            debtors.pop(0)
    return transfers


def compute_direct_balances(
    expenses: Iterable[LedgerExpense],
    settlements: Iterable[LedgerSettlement],
) -> dict[int, dict[str, int]]:
    """Compute direct 1-on-1 net balances per `(contact_id, currency)` from the owner's perspective.

    Positive means the contact owes the owner; negative means the owner owes the contact.
    """
    balances: dict[int, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for expense in expenses:
        for participant, share_minor in expense.shares:
            if share_minor == 0:
                continue
            if expense.paid_by is None and participant is not None:
                # Owner paid for this contact -> contact owes owner.
                balances[participant][expense.currency] += share_minor
            elif expense.paid_by is not None and participant is None:
                # Contact paid for owner -> owner owes contact.
                balances[expense.paid_by][expense.currency] -= share_minor

    for settlement in settlements:
        if settlement.voided:
            continue
        if settlement.from_party is None and settlement.to_party is not None:
            # Owner paid contact -> reduces what owner owes (moves balance positive).
            balances[settlement.to_party][settlement.currency] += settlement.amount_minor
        elif settlement.from_party is not None and settlement.to_party is None:
            # Contact paid owner -> reduces what contact owes (moves balance negative).
            balances[settlement.from_party][settlement.currency] -= settlement.amount_minor

    return {
        contact_id: {cur: amt for cur, amt in sorted(by_cur.items()) if amt != 0}
        for contact_id, by_cur in sorted(balances.items())
        if any(amt != 0 for amt in by_cur.values())
    }


def member_has_open_balance(
    expenses: Iterable[LedgerExpense],
    settlements: Iterable[LedgerSettlement],
    member_id: int,
) -> bool:
    """True if `member_id` has a non-zero balance in any currency inside the group."""
    snapshot = compute_group_snapshot(expenses, settlements)
    return any(nets.get(member_id, 0) != 0 for nets in snapshot.member_nets.values())


def compute_overview_totals(
    direct_balances: dict[int, dict[str, int]],
    group_transfers: Iterable[tuple[int, SimplifiedTransfer]],
) -> list[CurrencyTotals]:
    """Aggregate directional per-currency totals across direct contacts and groups WITHOUT netting across groups.

    `group_transfers` yields `(my_member_id, transfer)` pairs for each active group the user belongs to.
    """
    owed_to_you: dict[str, int] = defaultdict(int)
    you_owe: dict[str, int] = defaultdict(int)

    for by_currency in direct_balances.values():
        for currency, net_minor in by_currency.items():
            if net_minor > 0:
                owed_to_you[currency] += net_minor
            elif net_minor < 0:
                you_owe[currency] += -net_minor

    for my_member_id, transfer in group_transfers:
        if transfer.to_member_id == my_member_id:
            owed_to_you[transfer.currency] += transfer.amount_minor
        elif transfer.from_member_id == my_member_id:
            you_owe[transfer.currency] += transfer.amount_minor

    currencies = sorted(set(owed_to_you) | set(you_owe))
    return [
        CurrencyTotals(currency=cur, owed_to_you_minor=owed_to_you[cur], you_owe_minor=you_owe[cur])
        for cur in currencies
    ]
