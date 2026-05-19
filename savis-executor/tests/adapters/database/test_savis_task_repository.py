"""Tests for SQLAlchemy Savis task repository."""

# ruff: noqa: D103, S101

from datetime import UTC, datetime, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.adapters.database.savis_task_repository import (
    SavisTaskEntity,
    SqlAlchemySavisTaskRepository,
)
from app.adapters.database.session import Base
from app.core.models import (
    SavisTask,
    SavisTaskSortField,
    SavisTaskStatus,
    SavisTaskType,
    SortDirection,
)

TOTAL_TWO_TASKS = 2


def _repository() -> tuple[SqlAlchemySavisTaskRepository, sessionmaker[Session]]:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    return (
        SqlAlchemySavisTaskRepository(
            session_factory=session_factory,
            schema_creator=lambda: None,
        ),
        session_factory,
    )


def test_save_persists_task_fields() -> None:
    repository, session_factory = _repository()
    task = SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"})

    repository.save(task)

    with session_factory() as session:
        entity = session.get(SavisTaskEntity, str(task.id))
    assert entity is not None
    assert entity.type == SavisTaskType.GET_OFFERS.value
    assert entity.payload == {"search_term": "flour"}


def test_list_filters_by_status_and_type() -> None:
    repository, _session_factory = _repository()
    get_offers = SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"})
    refresh = SavisTask.create(
        SavisTaskType.REFRESH_OFFER,
        {"offer_id": "offer-id", "url": "https://example.com"},
    )
    refresh.status = SavisTaskStatus.FAILED
    repository.save(get_offers)
    repository.save(refresh)

    tasks, total = repository.list(SavisTaskStatus.FAILED, SavisTaskType.REFRESH_OFFER)

    assert total == 1
    assert [task.id for task in tasks] == [refresh.id]
    assert [task.type for task in tasks] == [SavisTaskType.REFRESH_OFFER]


def test_list_paginates_and_returns_total_count() -> None:
    repository, _session_factory = _repository()
    first = repository.save(
        SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"}),
    )
    second = repository.save(
        SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "sugar"}),
    )

    tasks, total = repository.list(SavisTaskStatus.IN_PROGRESS, None, page=2, size=1)

    assert total == TOTAL_TWO_TASKS
    assert [task.id for task in tasks] == [first.id]
    assert second.id != first.id


def test_list_sorts_before_paginating() -> None:
    repository, _session_factory = _repository()
    first = SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"})
    first.created_at = datetime(2026, 5, 17, 10, 0, tzinfo=UTC)
    second = SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "sugar"})
    second.created_at = datetime(2026, 5, 17, 11, 0, tzinfo=UTC)
    repository.save(first)
    repository.save(second)

    tasks, total = repository.list(
        page=1,
        size=1,
        sort_by=SavisTaskSortField.CREATED_AT,
        sort_direction=SortDirection.ASC,
    )

    assert total == TOTAL_TWO_TASKS
    assert [task.id for task in tasks] == [first.id]


def test_mark_completed_and_failed_update_status() -> None:
    repository, session_factory = _repository()
    completed = repository.save(
        SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"}),
    )
    failed = repository.save(
        SavisTask.create(SavisTaskType.REFRESH_OFFER, {"offer_id": "1", "url": "url"}),
    )

    repository.mark_completed(completed.id)
    repository.mark_failed(failed.id, "boom")

    with session_factory() as session:
        completed_entity = session.get(SavisTaskEntity, str(completed.id))
        failed_entity = session.get(SavisTaskEntity, str(failed.id))
    assert completed_entity is not None
    assert failed_entity is not None
    assert completed_entity.status == SavisTaskStatus.COMPLETED.value
    assert failed_entity.status == SavisTaskStatus.FAILED.value
    assert failed_entity.error_message == "boom"


def test_mark_stale_in_progress_as_failed() -> None:
    repository, session_factory = _repository()
    task = SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"})
    task.updated_at = datetime(2026, 5, 17, 10, 0, tzinfo=UTC)
    repository.save(task)

    count = repository.mark_stale_in_progress_as_failed(
        stale_before=task.updated_at + timedelta(hours=1),
        error="stale",
    )

    with session_factory() as session:
        entity = session.get(SavisTaskEntity, str(task.id))
    assert count == 1
    assert entity is not None
    assert entity.status == SavisTaskStatus.FAILED.value
