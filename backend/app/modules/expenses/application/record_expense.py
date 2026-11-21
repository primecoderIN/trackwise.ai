"""Saving an expense, converted first when it isn't in INR: ExpenseRecorder.create and .update (D204).

A use case (application layer) of the expenses module, and its public way to create and change expenses: POST and
PATCH /expenses (api.py) and MCP's add_expense and update_expense use it. Not a handler: an amount in another
currency needs a rate from the currency agent, a network call that mustn't happen inside the bus's unit of work. So
the recorder asks ExchangeRates first, then sends CreateExpense or UpdateExpense with the rate; the handlers work out
and store the INR amount (domain/base_amount.py). Expenses in INR need no rate and no call.
"""

from dataclasses import dataclass
from datetime import date

from app.core.cqrs import MessageBus
from app.core.money import BASE_CURRENCY
from app.modules.expenses.commands.create_expense import CreateExpense, NewExpense
from app.modules.expenses.commands.update_expense import ExpenseChanges, UpdateExpense
from app.modules.expenses.conversion.port import ExchangeRate, ExchangeRates
from app.modules.expenses.queries.get_expense import GetExpense


@dataclass(frozen=True)
class ExpenseRecorder:
    """Creates and changes expenses, with a rate for any amount not in INR. Needs the bus and the rates."""

    bus: MessageBus
    rates: ExchangeRates

    def create(self, owner_id: int, new: NewExpense) -> int:
        """Record `new` for `owner_id` and return its id.

        Raises UnsupportedCurrencyError or RatesUnavailableError (from the rates) for an amount in another currency
        that can't be converted, and whatever CreateExpense raises (an amount <= 0, an unknown category).
        """
        rate = self._rate(new.currency, new.spent_on)
        return self.bus.execute(CreateExpense(owner_id=owner_id, expense=new, rate=rate))

    def update(self, owner_id: int, expense_id: int, changes: ExpenseChanges) -> None:
        """Apply `changes` to one of `owner_id`'s expenses, converting it again if its amount, currency or date
        changes into (or within) another currency, or if a legacy row has no base amount yet.

        Raises NotFoundError for an expense they don't have, the rates' errors as for create, and whatever
        UpdateExpense raises.
        """
        current = self.bus.ask(GetExpense(owner_id=owner_id, expense_id=expense_id))
        amount = changes.amount if changes.amount is not None else current.amount
        currency = changes.currency or current.currency
        spent_on = changes.spent_on or current.spent_on
        needs_rate = (
            amount != current.amount
            or currency != current.currency
            or spent_on != current.spent_on
            or current.base_amount_minor is None
        )
        rate = self._rate(currency, spent_on) if needs_rate else None
        self.bus.execute(UpdateExpense(owner_id=owner_id, expense_id=expense_id, changes=changes, rate=rate))

    def _rate(self, currency: str, on: date) -> ExchangeRate | None:
        """The rate to INR for an amount in `currency` on `on`; None for INR, which needs none (and no call)."""
        return None if currency == BASE_CURRENCY else self.rates.to_base(currency, on)
