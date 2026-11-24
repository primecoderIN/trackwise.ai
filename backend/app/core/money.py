"""Money: major <-> minor units, currency codes, and writing an amount for people (core layer).

Amounts are stored and added up as whole minor units (integers, scaled by 100 for supported 2-decimal currencies), and
converted through Decimal, never float, so no rounding error can creep into a total. convert_minor is the one rule for
an amount in another currency: the expenses module stores both (D204), and the currency agent (agents/currency)
answers with the same arithmetic. Used by the expenses module (contracts, handlers, table), the MCP server and the
assistant's cards, seed.py, and the export script (which hands the currency values to the web app, whose formatMoney
writes amounts the same way, from the same CLDR data).
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Annotated

from pydantic import AfterValidator, Field

from app.core.i18n import DEFAULT_LANGUAGE, Language, format_currency_amount

DEFAULT_CURRENCY = "USD"
# The currency every expense is also stored in, and every total is added up in (D204 / D223): USD.
BASE_CURRENCY = DEFAULT_CURRENCY
# Per-user default currency for new accounts; restricted to supported 2-decimal currencies.
DEFAULT_USER_CURRENCY = DEFAULT_CURRENCY
SUPPORTED_CURRENCIES: tuple[str, ...] = ("USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD", "CHF", "AED")
MINOR_UNITS_PER_MAJOR = 100
# An ISO 4217 code in capitals ("USD", "EUR"). Lowercase "usd" is refused rather than quietly
# matching nothing, which would show a 0 total.
CURRENCY_PATTERN = r"^[A-Z]{3}$"
CurrencyCode = Annotated[str, Field(pattern=CURRENCY_PATTERN, examples=[DEFAULT_CURRENCY])]


def validate_supported_currency(value: str) -> str:
    """Validate that `value` is one of SUPPORTED_CURRENCIES, returning it unchanged if supported."""
    if value not in SUPPORTED_CURRENCIES:
        raise ValueError(f"currency must be one of: {', '.join(SUPPORTED_CURRENCIES)}")
    return value


SupportedCurrencyCode = Annotated[
    str,
    Field(pattern=CURRENCY_PATTERN, examples=[DEFAULT_USER_CURRENCY]),
    AfterValidator(validate_supported_currency),
]
# A currency's symbol where the app shows one on its own, such as a chart's unit ("$").
CURRENCY_SYMBOLS = {"USD": "$", "EUR": "€", "GBP": "£", "INR": "₹"}


def major_to_minor(amount: Decimal | int | str) -> int:
    """'45.50' -> 4550. Amounts in every supported currency are stored scaled by 100 (two decimal places)."""
    # Decimal, never float: floats can't hold most decimal fractions exactly (0.1 + 0.2 != 0.3).
    minor = Decimal(str(amount)) * MINOR_UNITS_PER_MAJOR
    if not minor.is_finite():
        raise ValueError(f"{amount} is not a finite amount")
    # Refuse fractional minor units (e.g. 45.505) rather than silently rounding money away.
    if minor != minor.to_integral_value():
        raise ValueError(f"{amount} has more than 2 decimal places")
    return int(minor)


def minor_to_major(minor: int) -> Decimal:
    """4550 -> Decimal('45.50')."""
    # scaleb(-2) shifts the decimal point two places and keeps both digits ("45.50", not "45.5").
    return Decimal(minor).scaleb(-2)


def format_money(amount: Decimal, currency: str, language: Language = DEFAULT_LANGUAGE) -> str:
    """Decimal('125000.5'), 'USD' -> '$125,000.50' in English; CLDR format in `language`'s locale."""
    return format_currency_amount(amount, currency, language)


def convert_minor(amount_minor: int, rate: Decimal) -> int:
    """An amount in minor units (cents, paise...) times `rate`, in the other currency's minor units: 400 cents at
    1.06 -> 424 cents. Rounded half up to a whole minor unit, the one place a conversion rounds (D204)."""
    if not rate.is_finite():
        raise ValueError(f"{rate} is not a finite exchange rate")
    return int((Decimal(amount_minor) * rate).quantize(Decimal(1), rounding=ROUND_HALF_UP))
