"""CreateGroup: create a Personal or Shared bill-splitting group with initial members (splits command slice)."""

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import IntegrityError
from sqlmodel import col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError, NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.core.money import SupportedCurrencyCode
from app.modules.splits.domain.rules import normalize_name_key, resolve_display_name
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitGroup, SplitGroupMember
from app.modules.splits.values import MAX_PARTICIPANTS, ContactId, DisplayName, GroupKind, MemberRole


# REST body for POST /splits/groups (no owner_id; server supplies it from session, D190).
class NewGroup(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    name: DisplayName
    kind: GroupKind = GroupKind.PERSONAL
    default_currency: SupportedCurrencyCode | None = None
    member_contact_ids: list[ContactId] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
    guest_names: list[DisplayName] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)


class CreateGroup(Command[int]):
    """Create a Personal or Shared group owned by `owner_id`, returning its new id."""

    owner_id: UserId
    owner_name: str | None = None
    group: NewGroup


def create_group(ctx: Context, command: CreateGroup) -> int:
    """Create the group, its creator owner-member row, and any initial contact or guest seats."""
    name = command.group.name.strip()
    name_key = normalize_name_key(name)
    conflict = ctx.session.exec(
        select(SplitGroup.id).where(col(SplitGroup.owner_id) == command.owner_id, col(SplitGroup.name_key) == name_key)
    ).first()
    if conflict is not None:
        raise BusinessRuleError(translatable(SplitText.GROUP_DUPLICATE, name=name))

    contact_ids = list(dict.fromkeys(command.group.member_contact_ids))
    contacts = repository.get_contacts_by_ids(ctx.session, command.owner_id, contact_ids)
    if len(contacts) != len(contact_ids):
        raise NotFoundError(translatable(SplitText.CONTACT_NOT_FOUND))
    for contact in contacts.values():
        if contact.archived_at is not None:
            raise BusinessRuleError(translatable(SplitText.CONTACT_ARCHIVED))

    now = ctx.clock.now()
    group = SplitGroup(
        owner_id=command.owner_id,
        kind=command.group.kind.value,
        name=name,
        name_key=name_key,
        default_currency=command.group.default_currency,
        archived_at=None,
        created_at=now,
    )
    ctx.session.add(group)
    try:
        ctx.session.flush()
    except IntegrityError as exc:
        raise BusinessRuleError(translatable(SplitText.GROUP_DUPLICATE, name=name)) from exc
    assert group.id is not None

    # Every group always starts with its creator as the single active registered OWNER member (D226).
    ctx.session.add(
        SplitGroupMember(
            group_id=group.id,
            user_id=command.owner_id,
            contact_id=None,
            display_name=resolve_display_name(command.owner_name),
            role=MemberRole.OWNER.value,
            added_by_user_id=command.owner_id,
            joined_at=now,
            left_at=None,
        )
    )
    for contact_id in contact_ids:
        contact = contacts[contact_id]
        ctx.session.add(
            SplitGroupMember(
                group_id=group.id,
                user_id=None,
                contact_id=contact_id,
                display_name=contact.name,
                role=MemberRole.MEMBER.value,
                added_by_user_id=command.owner_id,
                joined_at=now,
                left_at=None,
            )
        )
    for guest_name in command.group.guest_names:
        ctx.session.add(
            SplitGroupMember(
                group_id=group.id,
                user_id=None,
                contact_id=None,
                display_name=guest_name.strip(),
                role=MemberRole.MEMBER.value,
                added_by_user_id=command.owner_id,
                joined_at=now,
                left_at=None,
            )
        )
    ctx.session.flush()
    return group.id
