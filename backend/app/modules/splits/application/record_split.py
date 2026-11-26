"""SplitRecorder: idempotent, crash-recoverable orchestration of splits with personal Expenses & Budgets (D164, D226).

Not a bus handler: recording the caller's own share into `expenses` runs ExpenseRecorder (which may call the
currency agent for non-USD conversion) and SaveWatcher (budget alerts, D212) strictly outside the split's DB
transaction. Uses `split_expense_link` (`recording` -> `linked`) so retries never spawn duplicate personal expenses
and interrupted workflows expose a clean recovery path via LinkSplitExpense.
"""

import logging
from dataclasses import dataclass

from app.core.cqrs import MessageBus
from app.core.errors import BusinessRuleError
from app.core.i18n import Language, translatable
from app.core.money import minor_to_major
from app.modules import expenses
from app.modules.expenses import MAX_MERCHANT_LENGTH, ExpenseRecorder, NewExpense, SaveWatcher
from app.modules.splits.commands.begin_record_my_share import BeginRecordMyShare
from app.modules.splits.commands.complete_record_my_share import CompleteRecordMyShare
from app.modules.splits.commands.create_split_expense import CreateSplitExpense, NewSplitExpense
from app.modules.splits.commands.release_recording_claim import ReleaseRecordingClaim
from app.modules.splits.commands.split_input import RecordMyShareInput
from app.modules.splits.i18n import SplitText
from app.modules.splits.ledger_models import SavedSplitExpense
from app.modules.splits.queries.get_split_expense import GetSplitExpense
from app.modules.splits.values import ExpenseLinkStatus

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SplitRecorder:
    """Creates splits and idempotently records a participant's own share into their private personal Expenses."""

    bus: MessageBus
    expense_recorder: ExpenseRecorder
    save_watcher: SaveWatcher

    def create_split(self, owner_id: int, new_split: NewSplitExpense, language: Language) -> SavedSplitExpense:
        """Create `new_split` and, if `record_my_share` is set, record only `owner_id`'s share into Expenses."""
        split_id = self.bus.execute(CreateSplitExpense(owner_id=owner_id, split=new_split))
        if new_split.record_my_share is None:
            saved = self.bus.ask(GetSplitExpense(user_id=owner_id, split_id=split_id))
            return SavedSplitExpense(split=saved, notices=[])
        return self.record_my_share(owner_id, split_id, new_split.record_my_share, language)

    def record_my_share(
        self,
        owner_id: int,
        split_id: int,
        share_input: RecordMyShareInput,
        language: Language,
    ) -> SavedSplitExpense:
        """Idempotently record strictly `owner_id`'s own `my_share_minor` of `split_id` into personal Expenses."""
        split = self.bus.ask(GetSplitExpense(user_id=owner_id, split_id=split_id))
        if split.my_link_status is ExpenseLinkStatus.LINKED and split.my_linked_expense_id is not None:
            return SavedSplitExpense(split=split, notices=[])
        if split.my_share_minor <= 0:
            raise BusinessRuleError(translatable(SplitText.NO_SELF_SHARE))

        existing_expense_id = self.bus.execute(
            BeginRecordMyShare(owner_id=owner_id, split_id=split_id, category_id=share_input.category_id)
        )
        if existing_expense_id is not None:
            refreshed = self.bus.ask(GetSplitExpense(user_id=owner_id, split_id=split_id))
            return SavedSplitExpense(split=refreshed, notices=[])

        new_expense = NewExpense(
            amount=minor_to_major(split.my_share_minor, split.currency),
            currency=split.currency,
            category_id=share_input.category_id,
            merchant=split.description[:MAX_MERCHANT_LENGTH],
            note=split.note,
            spent_on=split.spent_on,
            payment_method=share_input.payment_method,
        )
        try:
            expense_id, notices = self.save_watcher.watch(
                owner_id,
                split.spent_on,
                lambda: self.expense_recorder.create(owner_id, new_expense),
                language,
            )
        except Exception:
            self.bus.execute(ReleaseRecordingClaim(owner_id=owner_id, split_id=split_id))
            raise

        try:
            self.bus.execute(CompleteRecordMyShare(owner_id=owner_id, split_id=split_id, expense_id=expense_id))
        except Exception:
            self._compensate_link_failure(owner_id, split_id, expense_id)
            raise

        refreshed = self.bus.ask(GetSplitExpense(user_id=owner_id, split_id=split_id))
        return SavedSplitExpense(split=refreshed, notices=notices)

    def _compensate_link_failure(self, owner_id: int, split_id: int, expense_id: int) -> None:
        """Best-effort cleanup if CompleteRecordMyShare fails after creating the personal expense."""
        try:
            self.bus.execute(expenses.DeleteExpense(owner_id=owner_id, expense_id=expense_id))
            self.bus.execute(ReleaseRecordingClaim(owner_id=owner_id, split_id=split_id))
        except Exception:
            # Leave the `recording` row intact so retries don't duplicate and UI offers LinkSplitExpense recovery.
            logger.exception(
                "Failed to compensate split link failure (split_id=%s, expense_id=%s); manual link recovery available.",
                split_id,
                expense_id,
            )
