"""Tests for SQLAlchemy scraping task repository."""

# ruff: noqa: D103, S101

from datetime import UTC, datetime, timedelta

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


def test_list_returns_tasks_newest_first() -> None:
    repository, _session_factory = _repository()
    older_task = ScrapingTask.create("flour")
    newer_task = ScrapingTask.create("sugar")
    older_time = datetime.now(UTC) - timedelta(hours=1)
    older_task.created_at = older_time
    older_task.updated_at = older_time
    repository.save(older_task)
    repository.save(newer_task)

    tasks = repository.list()

    assert [task.id for task in tasks] == [newer_task.id, older_task.id]


def test_list_filters_tasks_by_status() -> None:
    repository, _session_factory = _repository()
    in_progress_task = repository.save(ScrapingTask.create("flour"))
    failed_task = repository.save(ScrapingTask.create("sugar"))
    repository.mark_failed(failed_task.id, "provider timeout")

    tasks = repository.list(ScrapingTaskStatus.FAILED)

    assert [task.id for task in tasks] == [failed_task.id]
    assert in_progress_task.id not in [task.id for task in tasks]


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


def test_mark_stale_in_progress_as_failed_updates_old_in_progress_tasks() -> None:
    repository, session_factory = _repository()
    task = ScrapingTask.create("flour")
    old_time = datetime.now(UTC) - timedelta(hours=3)
    task.created_at = old_time
    task.updated_at = old_time
    repository.save(task)

    count = repository.mark_stale_in_progress_as_failed(
        stale_before=datetime.now(UTC) - timedelta(hours=2),
        error="Task timed out or worker never completed it",
    )

    with session_factory() as session:
        entity = session.get(ScrapingTaskEntity, str(task.id))

    assert count == 1
    assert entity is not None
    assert entity.status == ScrapingTaskStatus.FAILED.value
    assert entity.error_message == "Task timed out or worker never completed it"


def test_mark_stale_in_progress_as_failed_keeps_recent_in_progress_tasks() -> None:
    repository, session_factory = _repository()
    task = repository.save(ScrapingTask.create("flour"))

    count = repository.mark_stale_in_progress_as_failed(
        stale_before=datetime.now(UTC) - timedelta(hours=2),
        error="Task timed out or worker never completed it",
    )

    with session_factory() as session:
        entity = session.get(ScrapingTaskEntity, str(task.id))

    assert count == 0
    assert entity is not None
    assert entity.status == ScrapingTaskStatus.IN_PROGRESS.value
    assert entity.error_message is None


def test_mark_stale_in_progress_as_failed_does_not_change_completed_tasks() -> None:
    repository, session_factory = _repository()
    task = ScrapingTask.create("flour")
    old_time = datetime.now(UTC) - timedelta(hours=3)
    task.created_at = old_time
    task.updated_at = old_time
    repository.save(task)
    repository.mark_completed(task.id)

    count = repository.mark_stale_in_progress_as_failed(
        stale_before=datetime.now(UTC) - timedelta(hours=2),
        error="Task timed out or worker never completed it",
    )

    with session_factory() as session:
        entity = session.get(ScrapingTaskEntity, str(task.id))

    assert count == 0
    assert entity is not None
    assert entity.status == ScrapingTaskStatus.COMPLETED.value
