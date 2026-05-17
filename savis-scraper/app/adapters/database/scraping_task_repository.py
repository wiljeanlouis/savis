"""SQLAlchemy repository for scraping tasks."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, String, Text, and_, select, update
from sqlalchemy.orm import Mapped, Session, mapped_column, sessionmaker

from app.adapters.database.session import Base, SessionLocal, create_database_schema
from app.core.models import ScrapingTask, ScrapingTaskStatus
from app.core.ports import ScrapingTaskRepository

if TYPE_CHECKING:
    from collections.abc import Callable


class ScrapingTaskEntity(Base):
    """Database representation of a scraping task."""

    __tablename__ = "scraping_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    search_term: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


def _to_entity(task: ScrapingTask) -> ScrapingTaskEntity:
    return ScrapingTaskEntity(
        id=str(task.id),
        search_term=task.search_term,
        status=task.status.value,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        error_message=task.error_message,
    )


def _to_model(entity: ScrapingTaskEntity) -> ScrapingTask:
    return ScrapingTask(
        id=UUID(entity.id),
        search_term=entity.search_term,
        status=ScrapingTaskStatus(entity.status),
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        completed_at=entity.completed_at,
        error_message=entity.error_message,
    )


class SqlAlchemyScrapingTaskRepository(ScrapingTaskRepository):
    """Persist scraping tasks with SQLAlchemy."""

    def __init__(
        self,
        session_factory: sessionmaker[Session] = SessionLocal,
        schema_creator: Callable[[], None] = create_database_schema,
    ) -> None:
        """Initialize the repository."""
        self.session_factory = session_factory
        self.schema_creator = schema_creator

    def save(self, task: ScrapingTask) -> ScrapingTask:
        """Save a scraping task."""
        self.schema_creator()
        with self.session_factory() as session:
            entity = _to_entity(task)
            session.merge(entity)
            session.commit()
            return task

    def list(self, status: ScrapingTaskStatus | None = None) -> list[ScrapingTask]:
        """List scraping tasks, optionally filtered by status."""
        self.schema_creator()
        statement = select(ScrapingTaskEntity).order_by(
            ScrapingTaskEntity.created_at.desc(),
        )
        if status is not None:
            statement = statement.where(ScrapingTaskEntity.status == status.value)

        with self.session_factory() as session:
            entities = session.scalars(statement).all()
            return [_to_model(entity) for entity in entities]

    def mark_completed(self, task_id: UUID) -> None:
        """Mark a scraping task as completed."""
        self.schema_creator()
        with self.session_factory() as session:
            entity = session.get(ScrapingTaskEntity, str(task_id))
            if entity is None:
                return

            now = datetime.now(UTC)
            entity.status = ScrapingTaskStatus.COMPLETED.value
            entity.updated_at = now
            entity.completed_at = now
            entity.error_message = None
            session.commit()

    def mark_failed(self, task_id: UUID, error: str) -> None:
        """Mark a scraping task as failed."""
        self.schema_creator()
        with self.session_factory() as session:
            entity = session.get(ScrapingTaskEntity, str(task_id))
            if entity is None:
                return

            entity.status = ScrapingTaskStatus.FAILED.value
            entity.updated_at = datetime.now(UTC)
            entity.error_message = error
            session.commit()

    def mark_stale_in_progress_as_failed(
        self,
        stale_before: datetime,
        error: str,
    ) -> int:
        """Mark stale in-progress scraping tasks as failed."""
        self.schema_creator()
        now = datetime.now(UTC)
        with self.session_factory() as session:
            result = session.execute(
                update(ScrapingTaskEntity)
                .where(
                    and_(
                        ScrapingTaskEntity.status
                        == ScrapingTaskStatus.IN_PROGRESS.value,
                        ScrapingTaskEntity.updated_at < stale_before,
                    ),
                )
                .values(
                    status=ScrapingTaskStatus.FAILED.value,
                    updated_at=now,
                    error_message=error,
                ),
            )
            session.commit()
            return result.rowcount or 0  # pyright: ignore[reportAttributeAccessIssue]
