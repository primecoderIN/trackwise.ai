"""Pure minor-unit split allocation math: equal and exact distributions (splits domain, D226).

Operates strictly on integer minor units so rounding errors can never accumulate and `sum(shares) == total_minor`
always holds across every currency exponent (USD/INR=2, JPY=0, KWD=3).
"""

from collections.abc import Sequence

from app.core.errors import BusinessRuleError
from app.core.i18n import translatable
from app.modules.splits.i18n import SplitText


def _sort_key(participant: int | None) -> tuple[int, int]:
    """Deterministic ordering: None (direct self) first, then ascending integer id."""
    return (0, 0) if participant is None else (1, participant)


def allocate_equal[ParticipantKey: int | None](
    total_minor: int, participants: Sequence[ParticipantKey]
) -> list[tuple[ParticipantKey, int]]:
    """Split `total_minor` (> 0) equally across unique `participants` with deterministic +1 remainder distribution.

    Example: 1000 minor units across 3 participants -> [334, 333, 333] (sum == 1000).
    Raises BusinessRuleError on non-positive total, empty participants, or duplicate participants.
    """
    if total_minor <= 0:
        raise BusinessRuleError(translatable(SplitText.AMOUNT_NOT_POSITIVE))
    if not participants:
        raise BusinessRuleError(translatable(SplitText.PARTICIPANTS_REQUIRED))
    if len(set(participants)) != len(participants):
        raise BusinessRuleError(translatable(SplitText.DUPLICATE_PARTICIPANT))

    ordered = sorted(participants, key=_sort_key)
    base, remainder = divmod(total_minor, len(ordered))
    return [(participant, base + (1 if index < remainder else 0)) for index, participant in enumerate(ordered)]


def validate_exact_shares[ParticipantKey: int | None](
    total_minor: int,
    entries: Sequence[tuple[ParticipantKey, int]],
) -> list[tuple[ParticipantKey, int]]:
    """Validate exact per-participant minor-unit shares against `total_minor` (D226).

    Enforces non-empty unique participants, non-negative shares, and `sum(share_minor) == total_minor`.
    """
    if total_minor <= 0:
        raise BusinessRuleError(translatable(SplitText.AMOUNT_NOT_POSITIVE))
    if not entries:
        raise BusinessRuleError(translatable(SplitText.EXACT_SHARES_REQUIRED))
    seen: set[int | None] = set()
    total_shares = 0
    for participant, share_minor in entries:
        if participant in seen:
            raise BusinessRuleError(translatable(SplitText.DUPLICATE_PARTICIPANT))
        if share_minor < 0:
            raise BusinessRuleError(translatable(SplitText.NEGATIVE_SHARE))
        seen.add(participant)
        total_shares += share_minor
    if total_shares != total_minor:
        raise BusinessRuleError(translatable(SplitText.SHARES_MUST_MATCH_TOTAL))
    return sorted(entries, key=lambda item: _sort_key(item[0]))
