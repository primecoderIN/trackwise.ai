"""YearMonth: a calendar month as a value, like 2026-11 (core layer).

Before this, "YYYY-MM" was split, joined and shifted by hand in four places. A value object keeps
the rules (format, valid range, month arithmetic) in one spot. Used by the expenses module (the monthly
summary and trend), the MCP server and the assistant's insight cards.
"""

import calendar
from dataclasses import dataclass
from datetime import date
from typing import ClassVar, Self

MONTHS_PER_YEAR = 12
# Date bounds matching YearMonth's 1900-2099 span: keeps every expense date and month calculation in range.
MIN_DATE = date(1900, 1, 1)
MAX_DATE = date(2099, 12, 31)


# One calendar month. Immutable and ordered (2026-01 < 2026-02), so it can be a dict key and sorted.
# Comments rather than a docstring: GetMonthlySummary (a Pydantic query) has a YearMonth field, and Pydantic
# would copy a docstring into that query's JSON schema.
@dataclass(frozen=True, order=True)
class YearMonth:
    year: int
    month: int

    # YYYY-MM for years 1900-2099: ASCII digits only (matching JavaScript's RegExp), wide enough for any real
    # expense, and keeps date() away from years it can't represent (0000, or 9999-12's "next month").
    PATTERN: ClassVar[str] = r"^(19|20)[0-9]{2}-(0[1-9]|1[0-2])$"
    MIN_YEAR: ClassVar[int] = 1900
    MAX_YEAR: ClassVar[int] = 2099

    def __post_init__(self) -> None:
        """Refuse a month that doesn't exist or is outside MIN_YEAR..MAX_YEAR. Raises ValueError."""
        if not (self.MIN_YEAR <= self.year <= self.MAX_YEAR and 1 <= self.month <= MONTHS_PER_YEAR):
            raise ValueError(f"{self.year}-{self.month} is not a month between {self.MIN_YEAR} and {self.MAX_YEAR}")

    @classmethod
    def parse(cls, text: str) -> Self:
        """'2026-11' -> YearMonth(2026, 11). Raises ValueError for anything else."""
        year, separator, month = text.partition("-")
        if (
            not separator
            or len(year) != 4
            or len(month) != 2
            or not (year + month).isascii()
            or not (year + month).isdigit()
        ):
            raise ValueError(f"'{text}' is not a month written as YYYY-MM")
        return cls(int(year), int(month))

    @classmethod
    def of(cls, day: date) -> Self:
        """The month `day` falls in."""
        return cls(day.year, day.month)

    def __str__(self) -> str:
        """The month as YYYY-MM ('2026-11'), the form the API and the model use."""
        return f"{self.year:04d}-{self.month:02d}"

    def first_day(self) -> date:
        """The 1st of the month: where its date range starts."""
        return date(self.year, self.month, 1)

    def last_day(self) -> date:
        """The final calendar day of the month (e.g. 2099-12-31 without shifting past MAX_YEAR)."""
        return date(self.year, self.month, calendar.monthrange(self.year, self.month)[1])

    def next_month_first_day(self) -> date:
        """The 1st of the following calendar month (exclusive upper bound), safe even for 2099-12."""
        if self.month == MONTHS_PER_YEAR:
            return date(self.year + 1, 1, 1)
        return date(self.year, self.month + 1, 1)

    def previous(self) -> YearMonth | None:
        """The preceding month within MIN_YEAR..MAX_YEAR, or None for 1900-01."""
        return None if (self.year == self.MIN_YEAR and self.month == 1) else self.shift(-1)

    def shift(self, months: int) -> YearMonth:
        """The month `months` later (or earlier, if negative)."""
        index = self.year * MONTHS_PER_YEAR + (self.month - 1) + months
        return YearMonth(index // MONTHS_PER_YEAR, index % MONTHS_PER_YEAR + 1)
