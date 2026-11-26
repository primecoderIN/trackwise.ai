"""UpdateGroup: owner-only updates to group metadata, mode upgrade, membership, and archival (splits command slice)."""

from typing import Self

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from app.core.cqrs import Command, Context
from app.core.errors import BusinessRuleError, NotFoundError
from app.core.i18n import translatable
from app.core.ids import UserId
from app.core.money import SupportedCurrencyCode
from app.modules.splits.domain.access import require_group_owner, require_group_writable
from app.modules.splits.domain.balances import member_has_open_balance
from app.modules.splits.domain.rules import normalize_name_key
from app.modules.splits.i18n import SplitText
from app.modules.splits.persistence import repository
from app.modules.splits.persistence.tables import SplitGroup, SplitGroupMember
from app.modules.splits.values import MAX_PARTICIPANTS, ContactId, DisplayName, GroupId, GroupKind, MemberId, MemberRole


# REST body for PATCH /splits/groups/{group_id}; owner-only.
class GroupChanges(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    name: DisplayName | None = None
    default_currency: SupportedCurrencyCode | None = None
    upgrade_to_shared: bool = False
    add_contact_ids: list[ContactId] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
    add_guest_names: list[DisplayName] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
    remove_member_ids: list[MemberId] = Field(default_factory=list, max_length=MAX_PARTICIPANTS)
    archived: bool | None = None

    @model_validator(mode="after")
    def reject_null_required(self) -> Self:
        """Refuse explicit null on non-nullable fields (name, archived)."""
        for field in ("name", "archived"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class UpdateGroup(Command[None]):
    """Apply owner-authorized changes to a Personal or Shared group."""

    owner_id: UserId
    group_id: GroupId
    changes: GroupChanges


def _add_members(ctx: Context, group_id: int, owner_id: int, changes: GroupChanges) -> None:
    """Stage new contact and guest seats on `group_id`, skipping contacts already active in the group."""
    now = ctx.clock.now()
    if changes.add_contact_ids:
        unique_ids = list(dict.fromkeys(changes.add_contact_ids))
        contacts = repository.get_contacts_by_ids(ctx.session, owner_id, unique_ids)
        if len(contacts) != len(unique_ids):
            raise NotFoundError(translatable(SplitText.CONTACT_NOT_FOUND))
        existing_ids = set(
            ctx.session.exec(
                select(SplitGroupMember.contact_id).where(
                    col(SplitGroupMember.group_id) == group_id,
                    col(SplitGroupMember.contact_id).in_(unique_ids),
                    col(SplitGroupMember.left_at).is_(None),
                )
            ).all()
        )
        for contact_id in unique_ids:
            if contact_id in existing_ids:
                continue
            contact = contacts[contact_id]
            if contact.archived_at is not None:
                raise BusinessRuleError(translatable(SplitText.CONTACT_ARCHIVED))
            ctx.session.add(
                SplitGroupMember(
                    group_id=group_id,
                    user_id=None,
                    contact_id=contact_id,
                    display_name=contact.name,
                    role=MemberRole.MEMBER.value,
                    added_by_user_id=owner_id,
                    joined_at=now,
                    left_at=None,
                )
            )
    for guest_name in changes.add_guest_names:
        ctx.session.add(
            SplitGroupMember(
                group_id=group_id,
                user_id=None,
                contact_id=None,
                display_name=guest_name.strip(),
                role=MemberRole.MEMBER.value,
                added_by_user_id=owner_id,
                joined_at=now,
                left_at=None,
            )
        )


def _remove_members(ctx: Context, group_id: int, remove_ids: list[int]) -> None:
    """Remove non-owner active members whose balance across all currencies is zero (soft-leave if history exists)."""
    if not remove_ids:
        return
    expenses, settlements = repository.load_group_ledger(ctx.session, group_id)
    now = ctx.clock.now()
    for member_id in dict.fromkeys(remove_ids):
        member = ctx.session.exec(
            select(SplitGroupMember).where(
                col(SplitGroupMember.id) == member_id,
                col(SplitGroupMember.group_id) == group_id,
                col(SplitGroupMember.left_at).is_(None),
            )
        ).first()
        if member is None:
            raise NotFoundError(translatable(SplitText.MEMBER_NOT_FOUND))
        if member.role == MemberRole.OWNER.value:
            raise BusinessRuleError(translatable(SplitText.OWNER_CANNOT_LEAVE))
        if member_has_open_balance(expenses, settlements, member_id):
            raise BusinessRuleError(translatable(SplitText.MEMBER_HAS_BALANCE))
        if repository.member_has_history(ctx.session, member_id):
            member.left_at = now
        else:
            ctx.session.delete(member)


def _rename_group(session: Session, group: SplitGroup, owner_id: int, new_name: str) -> None:
    """Rename `group` while enforcing per-owner case-folded uniqueness."""
    cleaned = new_name.strip()
    key = normalize_name_key(cleaned)
    conflict = session.exec(
        select(SplitGroup.id).where(
            col(SplitGroup.owner_id) == owner_id,
            col(SplitGroup.name_key) == key,
            col(SplitGroup.id) != group.id,
        )
    ).first()
    if conflict is not None:
        raise BusinessRuleError(translatable(SplitText.GROUP_DUPLICATE, name=cleaned))
    group.name = cleaned
    group.name_key = key


def update_group(ctx: Context, command: UpdateGroup) -> None:
    """Update a group; unarchiving is allowed on archived groups while all other edits require an active group."""
    group, _ = require_group_owner(ctx.session, command.group_id, command.owner_id)
    changes = command.changes
    fields = changes.model_fields_set

    if "archived" in fields and changes.archived is False:
        group.archived_at = None

    has_non_archive_edits = bool(
        ("name" in fields)
        or ("default_currency" in fields)
        or changes.upgrade_to_shared
        or changes.add_contact_ids
        or changes.add_guest_names
        or changes.remove_member_ids
    )
    if has_non_archive_edits:
        require_group_writable(group)

    if "name" in fields and changes.name is not None:
        _rename_group(ctx.session, group, command.owner_id, changes.name)
    if "default_currency" in fields:
        group.default_currency = changes.default_currency
    if changes.upgrade_to_shared:
        if group.kind == GroupKind.SHARED.value:
            raise BusinessRuleError(translatable(SplitText.GROUP_ALREADY_SHARED))
        group.kind = GroupKind.SHARED.value

    _add_members(ctx, command.group_id, command.owner_id, changes)
    _remove_members(ctx, command.group_id, changes.remove_member_ids)

    if "archived" in fields and changes.archived is True:
        group.archived_at = ctx.clock.now()

    try:
        ctx.session.flush()
    except IntegrityError as exc:
        raise BusinessRuleError(translatable(SplitText.GROUP_DUPLICATE, name=group.name)) from exc
