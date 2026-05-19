"""SQLAlchemy session setup for executor persistence."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import EnvParams

if TYPE_CHECKING:
    from collections.abc import Generator

engine = create_engine(EnvParams.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy entities."""


def create_database_schema() -> None:
    """Create database tables managed by the executor."""
    Base.metadata.create_all(bind=engine)


def get_session() -> Generator[Session]:
    """Yield a database session."""
    with SessionLocal() as session:
        yield session
