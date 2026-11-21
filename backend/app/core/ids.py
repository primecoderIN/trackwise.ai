"""The rules for record ids, shared by every module's contracts and routes (core layer).

Kept apart from infrastructure/db.py, so contracts can use them without importing database infrastructure or
building the default engine.
"""

from typing import Annotated

from pydantic import Field

# The largest signed 64-bit integer supported by PostgreSQL and SQLite check engines. Larger ids get a
# clean 404/422 instead of crashing the database driver with an OverflowError (a 500).
MAX_ID = 2**63 - 1
# Any table's id, as callers may send it. (For a URL path, see web/dependencies.IdPath.)
RecordId = Annotated[int, Field(ge=1, le=MAX_ID)]
# A person: SpendWise's own user id (the accounts module's app_user.id). Every module's data names its owner with it,
# never with a provider's subject (D187), and every message about a person's data carries it as `owner_id` (D190).
# It always comes from the server's side (the session, an access token, the signed-in run), never from a request.
UserId = RecordId
