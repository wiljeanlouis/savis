"""Tests for Celery task lifecycle."""

# ruff: noqa: D101, D102, D103, D107, S101

from uuid import UUID, uuid4

import pytest

from app.adapters.celery import celery_tasks


class FakeExecuteScrapingUseCase:
    def __init__(self, offers: list[dict] | None = None) -> None:
        self.offers = offers or []
        self.terms: list[str] = []

    def scrape_offers(self, term: str) -> list[dict]:
        self.terms.append(term)
        return self.offers


class FakePublisher:
    def __init__(self, *, fail_success: bool = False) -> None:
        self.fail_success = fail_success
        self.success_payloads: list[dict] = []

    def publish_success(self, payload: dict) -> None:
        if self.fail_success:
            msg = "rabbitmq unavailable"
            raise RuntimeError(msg)
        self.success_payloads.append(payload)


class FakeScrapingTaskRepository:
    def __init__(self) -> None:
        self.completed: list[UUID] = []
        self.failed: list[tuple[UUID, str]] = []

    def mark_completed(self, task_id: UUID) -> None:
        self.completed.append(task_id)

    def mark_failed(self, task_id: UUID, error: str) -> None:
        self.failed.append((task_id, error))


def test_successful_scrape_marks_task_completed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid4()
    use_case = FakeExecuteScrapingUseCase(offers=[{"label": "Flour"}])
    publisher = FakePublisher()
    repository = FakeScrapingTaskRepository()

    monkeypatch.setattr(celery_tasks, "get_execute_scraping_use_case", lambda: use_case)
    monkeypatch.setattr(celery_tasks, "get_result_publisher", lambda: publisher)
    monkeypatch.setattr(
        celery_tasks,
        "get_scraping_task_repository",
        lambda: repository,
    )

    celery_tasks.scrape_offers_task.run(str(task_id), "flour")

    assert use_case.terms == ["flour"]
    assert publisher.success_payloads == [
        {"id": str(task_id), "offers": [{"label": "Flour"}]},
    ]
    assert repository.completed == [task_id]
    assert repository.failed == []


def test_reporting_task_marks_task_failed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid4()
    repository = FakeScrapingTaskRepository()

    monkeypatch.setattr(
        celery_tasks,
        "get_scraping_task_repository",
        lambda: repository,
    )

    celery_tasks.ReportingTask().on_failure(
        RuntimeError("provider timeout"),
        "celery-task-id",
        (str(task_id), "flour"),
        {},
        object(),
    )

    assert repository.failed == [(task_id, "provider timeout")]


def test_success_publisher_failure_prevents_completed_status(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid4()
    use_case = FakeExecuteScrapingUseCase()
    publisher = FakePublisher(fail_success=True)
    repository = FakeScrapingTaskRepository()

    monkeypatch.setattr(celery_tasks, "get_execute_scraping_use_case", lambda: use_case)
    monkeypatch.setattr(celery_tasks, "get_result_publisher", lambda: publisher)
    monkeypatch.setattr(
        celery_tasks,
        "get_scraping_task_repository",
        lambda: repository,
    )

    with pytest.raises(RuntimeError, match="rabbitmq unavailable"):
        celery_tasks.scrape_offers_task.run(str(task_id), "flour")

    assert repository.completed == []
