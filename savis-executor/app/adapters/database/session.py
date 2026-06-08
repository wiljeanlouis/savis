"""SQLAlchemy session setup for executor persistence."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import EnvParams

if TYPE_CHECKING:
    from collections.abc import Generator

engine_options = (
    {"connect_args": {"options": f"-csearch_path={EnvParams.DATABASE_SCHEMA}"}}
    if EnvParams.DATABASE_SCHEMA
    and EnvParams.DATABASE_URL.startswith(("postgresql://", "postgresql+"))
    else {}
)
engine = create_engine(EnvParams.DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy entities."""


def create_database_schema() -> None:
    """Create database tables managed by the executor."""
    if EnvParams.DATABASE_SCHEMA and engine.dialect.name == "postgresql":
        with engine.begin() as connection:
            connection.execute(
                text(f'CREATE SCHEMA IF NOT EXISTS "{EnvParams.DATABASE_SCHEMA}"'),
            )
    Base.metadata.create_all(bind=engine)


def get_session() -> Generator[Session]:
    """Yield a database session."""
    with SessionLocal() as session:
        yield session
