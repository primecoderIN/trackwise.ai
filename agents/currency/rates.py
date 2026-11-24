"""Where the currency agent's rates come from: the RateProvider interface, and MockRateProvider behind it for now.

The executor asks a RateProvider; the composition root (server.py) picks which. Today it's MockRateProvider: fixed,
made-up rates, so the app works offline and spends no quota (the owner's choice, Phase 25). A real provider (an
exchange-rate API) is one more class with the same method, chosen in server.create_app; nothing else changes (D203).
"""

from dataclasses import dataclass
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Protocol

# Decimal places kept in a cross rate (EUR -> GBP is worked out through USD): plenty for any amount the app holds.
RATE_PLACES = Decimal("1e-10")
# Where MockRateProvider's rates come from, as the answer reports it.
MOCK_SOURCE = "mock"
# What 1 unit of each supported 2-decimal currency is worth in the base currency. MADE-UP VALUES for development, not
# real quotes: never use them for real money. The base currency itself is 1.
MOCK_BASE_RATES: dict[str, Decimal] = {
    "USD": Decimal("1"),
    "EUR": Decimal("1.06"),
    "GBP": Decimal("1.27"),
    "INR": Decimal("0.0118"),
    "CAD": Decimal("0.71"),
    "AUD": Decimal("0.65"),
    "SGD": Decimal("0.75"),
    "CHF": Decimal("1.13"),
    "AED": Decimal("0.27"),
}


class UnsupportedCurrencyError(Exception):
    """The provider has no rate for this currency; its message names it."""


@dataclass(frozen=True)
class Rate:
    """What 1 unit of one currency is worth in another, the day that rate is for, and where it came from."""

    value: Decimal
    as_of: date
    source: str


class RateProvider(Protocol):
    """Gives exchange rates. Raises UnsupportedCurrencyError for a currency it doesn't know."""

    def rate(self, from_currency: str, to_currency: str, on: date) -> Rate:
        """What 1 unit of `from_currency` is worth in `to_currency` on `on` (or the nearest earlier day it has)."""
        ...


class MockRateProvider:
    """Fixed, made-up rates (MOCK_BASE_RATES), the same on every day; any pair is worked out through the base rate."""

    def rate(self, from_currency: str, to_currency: str, on: date) -> Rate:
        """The mock rate for the pair, reported as of `on`. Raises UnsupportedCurrencyError for an unknown currency."""
        for currency in (from_currency, to_currency):
            if currency not in MOCK_BASE_RATES:
                raise UnsupportedCurrencyError(currency)
        value = MOCK_BASE_RATES[from_currency] / MOCK_BASE_RATES[to_currency]
        return Rate(value=value.quantize(RATE_PLACES, rounding=ROUND_HALF_UP), as_of=on, source=MOCK_SOURCE)
