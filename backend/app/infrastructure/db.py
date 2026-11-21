"""PostgreSQL application engine, explicit SQLite check engines, and bus sessions (infrastructure).

create_db_engine() builds an engine for a SQLAlchemy URL. The running app requires Neon/PostgreSQL via DATABASE_URL;
SQLite-specific transaction handling remains for isolated checks that explicitly supply a SQLite engine.
session_factory() turns an engine into what the bus (core/cqrs.py) opens one session with per outermost message.

default_engine() is the required PostgreSQL engine from DATABASE_URL, built on the first call and kept: the
composition root (bootstrap.build) uses it unless it's given another engine, and the migrations' env.py runs on it
unless handed a connection. Importing this file builds nothing.
"""

from functools import cache
from typing import Any

from sqlalchemy import Engine, StaticPool, event, make_url
from sqlmodel import Session, create_engine

from app.core.cqrs import SessionFactory
from app.infrastructure.config import get_settings

# The backend name SQLAlchemy gives every SQLite URL ("sqlite:///...", "sqlite+pysqlite:///...").
SQLITE_BACKEND = "sqlite"
# How a SQLite URL names a database that lives only in memory ("sqlite://" has no database name at all).
IN_MEMORY_DATABASES = (None, "", ":memory:")
# Recycle idle Postgres connections every 5 minutes so Neon scale-to-zero never hands back dead sockets.
POSTGRES_POOL_RECYCLE_SECONDS = 300
# How long SQLite waits for another writer before raising SQLITE_BUSY (isolated check engines).
SQLITE_BUSY_TIMEOUT_MS = 5000


def create_db_engine(url: str) -> Engine:
    """An engine (a pool of connections) for the database at `url`; on SQLite, made fully transactional.

    Creating it doesn't connect yet: the first connection is made on first use. Non-SQLite engines enable
    `pool_pre_ping` and `pool_recycle` so serverless PostgreSQL (Neon) connections recover cleanly after idle suspend.
    """
    parsed = make_url(url)
    is_sqlite = parsed.get_backend_name() == SQLITE_BACKEND
    # SQLite normally lets only the thread that opened a connection use it, but FastAPI runs plain `def`
    # routes in a thread pool. Other databases (Postgres) don't need this option.
    connect_args = {"check_same_thread": False} if is_sqlite else {}
    # An in-memory SQLite database exists only inside its connection, and SQLAlchemy would give each thread its
    # own: every request would see a different, empty database. One shared connection keeps it one database.
    in_memory = is_sqlite and parsed.database in IN_MEMORY_DATABASES
    pool_options: dict[str, Any] = (
        {"poolclass": StaticPool}
        if in_memory
        else ({} if is_sqlite else {"pool_pre_ping": True, "pool_recycle": POSTGRES_POOL_RECYCLE_SECONDS})
    )
    engine = create_engine(url, connect_args=connect_args, **pool_options)
    if is_sqlite:
        # Python's sqlite3 driver manages transactions itself, and gets two things wrong for us: it commits
        # schema changes (CREATE, ALTER, DROP) immediately, so a migration that fails halfway stays half done,
        # and it breaks SAVEPOINTs. SQLAlchemy's documented fix: turn the driver's handling off, and start
        # every transaction ourselves.
        # https://docs.sqlalchemy.org/en/20/dialects/sqlite.html#serializable-isolation-savepoints-transactional-ddl
        event.listen(engine, "connect", _sqlite_connect(in_memory))
        event.listen(engine, "begin", _begin)
    return engine


def _sqlite_connect(in_memory: bool) -> Any:
    """Configure each new SQLite connection: explicit transactions, foreign keys, busy timeout, and WAL on disk."""

    def _configure(dbapi_connection: Any, connection_record: Any) -> None:
        dbapi_connection.isolation_level = None
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys = ON")
            cursor.execute(f"PRAGMA busy_timeout = {SQLITE_BUSY_TIMEOUT_MS}")
            if not in_memory:
                cursor.execute("PRAGMA journal_mode = WAL")
                cursor.execute("PRAGMA synchronous = NORMAL")
        finally:
            cursor.close()

    return _configure


def _begin(connection: Any) -> None:
    """Send an explicit BEGIN whenever SQLAlchemy starts a transaction, now that the driver doesn't.

    Everything up to the COMMIT or ROLLBACK is then one real SQLite transaction, schema changes included.
    """
    connection.exec_driver_sql("BEGIN")


def session_factory(engine: Engine) -> SessionFactory:
    """The session factory for `engine`: what the composition root hands to the bus."""

    def new_session() -> Session:
        """A new session on the engine, for one unit of work.

        The bus opens one per outermost message and decides when it commits; handlers never open their own.
        """
        # The tables are created and changed by migrations (backend/migrations), never by the app itself.
        return Session(engine)

    return new_session


@cache
def default_engine() -> Engine:
    """The required Neon/PostgreSQL engine from DATABASE_URL, built on first use and kept for the process."""
    return create_db_engine(get_settings().require_database_url())
