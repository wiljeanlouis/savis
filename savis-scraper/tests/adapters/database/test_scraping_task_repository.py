"""Tests for SQLAlchemy scraping task repository."""

# ruff: noqa: D103, S101

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.adapters.database.scraping_task_repository import (
    ScrapingTaskEntity,
    SqlAlchemyScrapingTaskRepository,
)
from app.adapters.database.session import Base
from app.core.models import ScrapingTask, ScrapingTaskStatus


def _repository() -> tuple[
    SqlAlchemyScrapingTaskRepository,
    sessionmaker[Session],
]:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    return (
        SqlAlchemyScrapingTaskRepository(
            session_factory=session_factory,
            schema_creator=lambda: None,
        ),
        session_factory,
    )


def test_save_persists_scraping_task_fields() -> None:
    repository, session_factory = _repository()
    task = ScrapingTask.create("flour")

    repository.save(task)

    with session_factory() as session:
        entity = session.get(ScrapingTaskEntity, str(task.id))

    assert entity is not None
    assert entity.search_term == "flour"
    assert entity.status == ScrapingTaskStatus.IN_PROGRESS.value
    assert entity.created_at is not None
    assert entity.updated_at is not None
    assert entity.completed_at is None
    assert entity.error_message is None


def test_mark_completed_updates_status_and_completion_time() -> None:
    repository, session_factory = _repository()
    task = repository.save(ScrapingTask.create("flour"))

    repository.mark_completed(task.id)

    with session_factory() as session:
        entity = session.get(ScrapingTaskEntity, str(task.id))

    assert entity is not None
    assert entity.status == ScrapingTaskStatus.COMPLETED.value
    assert entity.completed_at is not None
    assert entity.error_message is None


def test_mark_failed_updates_status_and_error_message() -> None:
    repository, session_factory = _repository()
    task = repository.save(ScrapingTask.create("flour"))

    repository.mark_failed(task.id, "provider timeout")

    with session_factory() as session:
        entity = session.get(ScrapingTaskEntity, str(task.id))

    assert entity is not None
    assert entity.status == ScrapingTaskStatus.FAILED.value
    assert entity.completed_at is None
    assert entity.error_message == "provider timeout"
