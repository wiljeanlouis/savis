"""Tests for Celery task lifecycle."""

# ruff: noqa: D101, D102, D103, D107, S101

from uuid import UUID, uuid7

import pytest

from app.adapters.celery import celery_tasks


class FakeExecuteScrapingUseCase:
    def __init__(self, offers: list[dict] | None = None) -> None:
        self.offers = offers or []
        self.terms: list[str] = []

    def scrape_offers(self, term: str) -> list[dict]:
        self.terms.append(term)
        return self.offers


class FakeOffersUseCase:
    def __init__(self) -> None:
        self.calls: list[tuple[list[dict], str, UUID]] = []

    def track(
        self,
        offers: list[dict],
        search_term: str,
        scraping_task_id: UUID,
    ) -> None:
        self.calls.append((offers, search_term, scraping_task_id))


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
    task_id = uuid7()
    use_case = FakeExecuteScrapingUseCase(offers=[{"label": "Flour"}])
    offers_use_case = FakeOffersUseCase()
    repository = FakeScrapingTaskRepository()

    monkeypatch.setattr(celery_tasks, "get_execute_scraping_use_case", lambda: use_case)
    monkeypatch.setattr(
        celery_tasks,
        "get_offers_use_case",
        lambda: offers_use_case,
    )
    monkeypatch.setattr(
        celery_tasks,
        "get_scraping_task_repository",
        lambda: repository,
    )

    celery_tasks.scrape_offers_task.run(str(task_id), "flour")

    assert use_case.terms == ["flour"]
    assert offers_use_case.calls == [([{"label": "Flour"}], "flour", task_id)]
    assert repository.completed == [task_id]
    assert repository.failed == []


def test_reporting_task_marks_task_failed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid7()
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


def test_scraping_failure_prevents_tracking_and_completed_status(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    task_id = uuid7()
    use_case = FakeExecuteScrapingUseCase()
    offers_use_case = FakeOffersUseCase()
    repository = FakeScrapingTaskRepository()

    def raise_on_scrape() -> list[dict]:
        msg = "provider timeout"
        raise RuntimeError(msg)

    def failing_scrape_offers(term: str) -> list[dict]:  # noqa: ARG001
        return raise_on_scrape()

    monkeypatch.setattr(use_case, "scrape_offers", failing_scrape_offers)
    monkeypatch.setattr(
        celery_tasks,
        "get_execute_scraping_use_case",
        lambda: use_case,
    )
    monkeypatch.setattr(
        celery_tasks,
        "get_offers_use_case",
        lambda: offers_use_case,
    )
    monkeypatch.setattr(
        celery_tasks,
        "get_scraping_task_repository",
        lambda: repository,
    )

    with pytest.raises(RuntimeError, match="provider timeout"):
        celery_tasks.scrape_offers_task.run(str(task_id), "flour")

    assert repository.completed == []
    assert offers_use_case.calls == []
