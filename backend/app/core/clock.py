"""The current date and time, as a dependency instead of a global.

Code that asks `date.today()` directly can only ever see the real day, so "this month" can't be
pinned in a check, and every caller silently uses the server's time zone. Handlers get a Clock
instead; the app gives them the system clock, and anything else (a script, a check) can pass its own.

Core layer: bootstrap.build() picks the clock, the bus hands it to every handler (ctx.clock), and routes get it
through web/dependencies.ClockDep.
"""

from datetime import UTC, date, datetime
from functools import cache
from typing import Annotated, Protocol
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, available_timezones

from pydantic import AfterValidator, Field

DEFAULT_TIMEZONE = "UTC"
MAX_TIMEZONE_LENGTH = 64


@cache
def _available_timezones() -> frozenset[str]:
    """Lazily load valid IANA time zone keys without reading tzdata at import time."""
    return frozenset(available_timezones())


def validate_timezone(value: str) -> str:
    """Ensure `value` is 'UTC' or a canonical 'Area/Location' IANA time zone name."""
    cleaned = value.strip()
    if not cleaned or len(cleaned) > MAX_TIMEZONE_LENGTH:
        raise ValueError("timezone must be a valid IANA time zone")
    # Restrict single-token names to UTC so legacy abbreviations (EST, CET) and Factory don't slip through.
    if cleaned != DEFAULT_TIMEZONE and ("/" not in cleaned or cleaned not in _available_timezones()):
        raise ValueError(f"unknown IANA timezone: {cleaned}")
    try:
        ZoneInfo(cleaned)
    except ZoneInfoNotFoundError as exc:
        raise ValueError(f"unknown IANA timezone: {cleaned}") from exc
    return cleaned


TimeZoneName = Annotated[
    str,
    Field(min_length=1, max_length=MAX_TIMEZONE_LENGTH, examples=[DEFAULT_TIMEZONE]),
    AfterValidator(validate_timezone),
]


def as_utc(moment: datetime) -> datetime:
    """`moment` as an aware UTC time. SQLite gives stored times back without their zone; they were stored in UTC.
    Non-UTC aware timestamps (e.g. from another session time zone) are converted to UTC."""
    return moment.astimezone(UTC) if moment.tzinfo is not None else moment.replace(tzinfo=UTC)


# A moment read back from the database, always aware UTC, so its JSON carries the zone ("+00:00") and a browser
# shows it in the person's own time, not the server's.
UtcDateTime = Annotated[datetime, AfterValidator(as_utc)]


class Clock(Protocol):
    """Where the app gets the date and time. Any object with these two methods will do.

    today() is the date that "this month" and default dates are based on; now() is a time-zone-aware moment,
    for timestamps such as an expense's created_at.
    """

    def today(self) -> date:
        """Today's date: what "this month" and default dates are based on."""
        ...

    def now(self) -> datetime:
        """The current moment, time-zone aware (UTC in the app): for timestamps such as created_at."""
        ...


class SystemClock:
    """The real clock, which the app uses unless bootstrap.build() is given another."""

    def today(self) -> date:
        """Today's date on the server."""
        # The server's local date when no user time zone is supplied; user-scoped operations use clock_today().
        return date.today()

    def now(self) -> datetime:
        """The current moment, in UTC."""
        # Always UTC for timestamps; showing them in local time is the client's job.
        return datetime.now(UTC)


def parse_timezone(name: str) -> ZoneInfo:
    """Return a `ZoneInfo` for a valid IANA time zone name (such as 'UTC' or 'America/New_York')."""
    return ZoneInfo(validate_timezone(name))


def clock_today(clock: Clock, timezone: str | ZoneInfo = DEFAULT_TIMEZONE) -> date:
    """Today's calendar date in `timezone` according to `clock.now()`."""
    zone = parse_timezone(timezone) if isinstance(timezone, str) else timezone
    return as_utc(clock.now()).astimezone(zone).date()
