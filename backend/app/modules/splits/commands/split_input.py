"""Shared input schemas and share-resolution helpers for CreateSplitExpense and UpdateSplitExpense (splits commands)."""

from pydantic import BaseModel, ConfigDict, Field
from sqlmodel import Session, col, select

from app.core.errors import BusinessRuleError, NotFoundError
from app.core.i18n import translatable
from app.modules.categories import CategoryId
from app.modules.expenses import PaymentMethod
from app.modules.splits.domain.math import allocate_equal, validate_exact_shares
from app.modules.splits.domain.rules import parse_amount_minor
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitGroupMember
from app.modules.splits.values import MAX_PARTICIPANTS, ContactId, MemberId, SplitAmount, SplitMethod


# One participant's custom exact amount when split_method == "exact".
class ExactShareInput(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    member_id: MemberId | None = None
    contact_id: ContactId | None = None
    is_self: bool = False
    amount: SplitAmount


# Optional instruction to also record the caller's own share as a personal expense via ExpenseRecorder (D226).
class RecordMyShareInput(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    category_id: CategoryId
    payment_method: PaymentMethod = PaymentMethod.OTHER


def resolve_group_shares(
    session: Session,
    group_id: int,
    *,
    amount_minor: int,
    currency: str,
    split_method: SplitMethod,
    paid_by_member_id: int | None,
    participant_member_ids: list[int],
    exact_shares: list[ExactShareInput],
) -> tuple[int, list[tuple[int, int]]]:
    """Validate group payer & active participants, returning `(paid_by_member_id, [(member_id, share_minor), ...])`."""
    active_ids = set(
        session.exec(
            select(SplitGroupMember.id).where(
                col(SplitGroupMember.group_id) == group_id,
                col(SplitGroupMember.left_at).is_(None),
            )
        ).all()
    )
    if paid_by_member_id is None or paid_by_member_id not in active_ids:
        raise NotFoundError(translatable(SplitText.MEMBER_NOT_FOUND))

    if split_method is SplitMethod.EQUAL:
        for member_id in participant_member_ids:
            if member_id not in active_ids:
                raise NotFoundError(translatable(SplitText.MEMBER_NOT_FOUND))
        allocated = allocate_equal(amount_minor, participant_member_ids)
        return paid_by_member_id, [(mid, share) for mid, share in allocated if mid is not None]

    entries: list[tuple[int, int]] = []
    for item in exact_shares:
        if item.member_id is None or item.contact_id is not None or item.is_self:
            raise BusinessRuleError(translatable(SplitText.EXACT_SHARES_REQUIRED))
        if item.member_id not in active_ids:
            raise NotFoundError(translatable(SplitText.MEMBER_NOT_FOUND))
        entries.append((item.member_id, parse_amount_minor(item.amount, currency, allow_zero=True)))
    validated = validate_exact_shares(amount_minor, entries)
    return paid_by_member_id, [(mid, share) for mid, share in validated if mid is not None]


def resolve_direct_shares(
    session: Session,
    owner_id: int,
    *,
    amount_minor: int,
    currency: str,
    split_method: SplitMethod,
    paid_by_contact_id: int | None,
    participant_contact_ids: list[int],
    include_self: bool,
    exact_shares: list[ExactShareInput],
) -> tuple[int | None, list[tuple[int | None, int]]]:
    """Validate direct-split contacts (owner-scoped, active) and return `(paid_by_contact_id, shares)`.

    Enforces that the owner is involved (payer or participant) and at least one contact is involved.
    """
    needed_contacts: set[int] = set()
    if paid_by_contact_id is not None:
        needed_contacts.add(paid_by_contact_id)

    if split_method is SplitMethod.EQUAL:
        needed_contacts.update(participant_contact_ids)
        _verify_active_contacts(session, owner_id, needed_contacts)
        participants: list[int | None] = list(participant_contact_ids)
        if include_self:
            participants.append(None)
        shares = allocate_equal(amount_minor, participants)
    else:
        entries: list[tuple[int | None, int]] = []
        for item in exact_shares:
            if item.member_id is not None or (item.is_self and item.contact_id is not None):
                raise BusinessRuleError(translatable(SplitText.EXACT_SHARES_REQUIRED))
            if not item.is_self and item.contact_id is None:
                raise BusinessRuleError(translatable(SplitText.EXACT_SHARES_REQUIRED))
            if item.contact_id is not None:
                needed_contacts.add(item.contact_id)
            key = None if item.is_self else item.contact_id
            entries.append((key, parse_amount_minor(item.amount, currency, allow_zero=True)))
        _verify_active_contacts(session, owner_id, needed_contacts)
        shares = validate_exact_shares(amount_minor, entries)

    contact_present = paid_by_contact_id is not None or any(cid is not None for cid, _ in shares)
    if not contact_present:
        raise BusinessRuleError(translatable(SplitText.DIRECT_SPLIT_NEEDS_CONTACT))
    self_present = paid_by_contact_id is None or any(cid is None for cid, _ in shares)
    if not self_present:
        raise BusinessRuleError(translatable(SplitText.DIRECT_SPLIT_NEEDS_SELF))
    return paid_by_contact_id, shares


def _verify_active_contacts(session: Session, owner_id: int, contact_ids: set[int]) -> None:
    """Confirm every contact belongs to `owner_id` and is not archived."""
    if not contact_ids:
        return
    contacts = repository.get_contacts_by_ids(session, owner_id, sorted(contact_ids))
    if len(contacts) != len(contact_ids):
        raise NotFoundError(translatable(SplitText.CONTACT_NOT_FOUND))
    for contact in contacts.values():
        if contact.archived_at is not None:
            raise BusinessRuleError(translatable(SplitText.CONTACT_ARCHIVED))


ParticipantMemberIds = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
ParticipantContactIds = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
ExactSharesList = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
