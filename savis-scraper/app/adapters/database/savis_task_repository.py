"""SQLAlchemy repository for executor tasks."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import JSON, DateTime, String, Text, and_, func, select, update
from sqlalchemy.orm import Mapped, Session, mapped_column, sessionmaker

from app.adapters.database.session import Base, SessionLocal, create_database_schema
from app.core.models import SavisTask, SavisTaskStatus, SavisTaskType
from app.core.ports import SavisTaskRepository

if TYPE_CHECKING:
    from collections.abc import Callable


class SavisTaskEntity(Base):
    """Database representation of an executor task."""

    __tablename__ = "savis_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict[str, str]] = mapped_column(JSON, nullable=False)
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


def _to_entity(task: SavisTask) -> SavisTaskEntity:
    return SavisTaskEntity(
        id=str(task.id),
        type=task.type.value,
        payload=task.payload,
        status=task.status.value,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        error_message=task.error_message,
    )


def _to_model(entity: SavisTaskEntity) -> SavisTask:
    return SavisTask(
        id=UUID(entity.id),
        type=SavisTaskType(entity.type),
        payload=entity.payload,
        status=SavisTaskStatus(entity.status),
        created_at=entity.created_at,
        updated_at=entity.updated_at,
        completed_at=entity.completed_at,
        error_message=entity.error_message,
    )


class SqlAlchemySavisTaskRepository(SavisTaskRepository):
    """Persist executor tasks with SQLAlchemy."""

    def __init__(
        self,
        session_factory: sessionmaker[Session] = SessionLocal,
        schema_creator: Callable[[], None] = create_database_schema,
    ) -> None:
        """Initialize the repository."""
        self.session_factory = session_factory
        self.schema_creator = schema_creator

    def save(self, task: SavisTask) -> SavisTask:
        """Save a task."""
        self.schema_creator()
        with self.session_factory() as session:
            session.merge(_to_entity(task))
            session.commit()
            return task

    def list(
        self,
        status: SavisTaskStatus | None = None,
        task_type: SavisTaskType | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[SavisTask], int]:
        """List paged tasks and total count."""
        self.schema_creator()
        statement = select(SavisTaskEntity).order_by(SavisTaskEntity.created_at.desc())
        count_statement = select(func.count()).select_from(SavisTaskEntity)
        if status is not None:
            statement = statement.where(SavisTaskEntity.status == status.value)
            count_statement = count_statement.where(
                SavisTaskEntity.status == status.value,
            )
        if task_type is not None:
            statement = statement.where(SavisTaskEntity.type == task_type.value)
            count_statement = count_statement.where(
                SavisTaskEntity.type == task_type.value,
            )
        with self.session_factory() as session:
            total = session.scalar(count_statement) or 0
            entities = session.scalars(
                statement.offset((page - 1) * size).limit(size),
            ).all()
            return [_to_model(entity) for entity in entities], total

    def mark_completed(self, task_id: UUID) -> None:
        """Mark a task as completed."""
        self.schema_creator()
        with self.session_factory() as session:
            entity = session.get(SavisTaskEntity, str(task_id))
            if entity is None:
                return
            now = datetime.now(UTC)
            entity.status = SavisTaskStatus.COMPLETED.value
            entity.updated_at = now
            entity.completed_at = now
            entity.error_message = None
            session.commit()

    def mark_failed(self, task_id: UUID, error: str) -> None:
        """Mark a task as failed."""
        self.schema_creator()
        with self.session_factory() as session:
            entity = session.get(SavisTaskEntity, str(task_id))
            if entity is None:
                return
            entity.status = SavisTaskStatus.FAILED.value
            entity.updated_at = datetime.now(UTC)
            entity.error_message = error
            session.commit()

    def mark_stale_in_progress_as_failed(
        self,
        stale_before: datetime,
        error: str,
    ) -> int:
        """Mark stale in-progress tasks as failed."""
        self.schema_creator()
        now = datetime.now(UTC)
        with self.session_factory() as session:
            result = session.execute(
                update(SavisTaskEntity)
                .where(
                    and_(
                        SavisTaskEntity.status == SavisTaskStatus.IN_PROGRESS.value,
                        SavisTaskEntity.updated_at < stale_before,
                    ),
                )
                .values(
                    status=SavisTaskStatus.FAILED.value,
                    updated_at=now,
                    error_message=error,
                ),
            )
            session.commit()
            return result.rowcount or 0  # pyright: ignore[reportAttributeAccessIssue]
