"""Tests for executor task use case."""

# ruff: noqa: D101, D102, D103, D107, S101

from typing import TYPE_CHECKING
from uuid import UUID, uuid7

import pytest

from app.core.models import SavisTask, SavisTaskStatus, SavisTaskType
from app.core.ports import SavisTaskRepository, TaskQueue
from app.core.use_case_savis_tasks import SavisTaskUseCase

if TYPE_CHECKING:
    from datetime import datetime

STALE_COUNT = 2

class FakeTaskQueue(TaskQueue):
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.get_offers: list[tuple[str, str]] = []
        self.refreshes: list[tuple[str, str, str]] = []

    def push_get_offers(self, task_id: str, search_term: str) -> None:
        if self.fail:
            msg = "queue unavailable"
            raise RuntimeError(msg)
        self.get_offers.append((task_id, search_term))

    def push_refresh_offer(self, task_id: str, offer_id: str, url: str) -> None:
        self.refreshes.append((task_id, offer_id, url))


class FakeTaskRepository(SavisTaskRepository):
    def __init__(self, tasks: list[SavisTask] | None = None) -> None:
        self.tasks = tasks or []
        self.completed: list[UUID] = []
        self.failed: list[tuple[UUID, str]] = []
        self.filters: list[tuple[SavisTaskStatus | None, SavisTaskType | None]] = []
        self.pages: list[tuple[int, int]] = []

    def list(
        self,
        status: SavisTaskStatus | None = None,
        task_type: SavisTaskType | None = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[SavisTask], int]:
        self.filters.append((status, task_type))
        self.pages.append((page, size))
        return self.tasks, len(self.tasks)

    def save(self, task: SavisTask) -> SavisTask:
        self.tasks.append(task)
        return task

    def mark_completed(self, task_id: UUID) -> None:
        self.completed.append(task_id)

    def mark_failed(self, task_id: UUID, error: str) -> None:
        self.failed.append((task_id, error))

    def mark_stale_in_progress_as_failed(
        self,
        stale_before: datetime,  # noqa: ARG002
        error: str,  # noqa: ARG002
    ) -> int:
        return STALE_COUNT


class FakeOffersUseCase:
    def __init__(self) -> None:
        self.get_offers_calls: list[tuple[str, UUID]] = []
        self.refresh_calls: list[tuple[UUID, str, UUID]] = []

    def get_offers(
        self,
        search_term: str,
        task_id: UUID,
    ) -> None:
        self.get_offers_calls.append((search_term, task_id))

    def refresh_offer_by_url(self, offer_id: UUID, url: str, task_id: UUID) -> None:
        self.refresh_calls.append((offer_id, url, task_id))


def _use_case(
    repository: FakeTaskRepository | None = None,
    queue: FakeTaskQueue | None = None,
) -> tuple[SavisTaskUseCase, FakeTaskRepository, FakeTaskQueue, FakeOffersUseCase]:
    task_repository = repository or FakeTaskRepository()
    task_queue = queue or FakeTaskQueue()
    offers_use_case = FakeOffersUseCase()
    return (
        SavisTaskUseCase(
            task_queue,
            task_repository,
            offers_use_case,
        ),
        task_repository,
        task_queue,
        offers_use_case,
    )


def test_enqueue_savis_task_get_offers_creates_and_pushes_task() -> None:
    use_case, repository, queue, _offers_use_case = _use_case()

    task = use_case.enqueue_savis_task(
        SavisTaskType.GET_OFFERS,
        {"search_term": "flour"},
    )

    assert task.type == SavisTaskType.GET_OFFERS
    assert task.payload == {"search_term": "flour"}
    assert task.status == SavisTaskStatus.IN_PROGRESS
    assert repository.tasks == [task]
    assert queue.get_offers == [(str(task.id), "flour")]


def test_enqueue_savis_task_marks_failed_when_queue_fails() -> None:
    use_case, repository, _queue, _offers_use_case = _use_case(
        queue=FakeTaskQueue(fail=True),
    )

    with pytest.raises(RuntimeError, match="queue unavailable"):
        use_case.enqueue_savis_task(
            SavisTaskType.GET_OFFERS,
            {"search_term": "flour"},
        )

    assert repository.failed == [(repository.tasks[0].id, "queue unavailable")]


def test_enqueue_savis_task_refresh_offer_creates_persisted_task() -> None:
    use_case, repository, queue, _offers_use_case = _use_case()

    task = use_case.enqueue_savis_task(
        SavisTaskType.REFRESH_OFFER,
        {"offer_id": "offer-id", "url": "https://example.com/offer"},
    )

    assert task.type == SavisTaskType.REFRESH_OFFER
    assert task.payload == {
        "offer_id": "offer-id",
        "url": "https://example.com/offer",
    }
    assert repository.tasks == [task]
    assert queue.refreshes == [(str(task.id), "offer-id", "https://example.com/offer")]


def test_execute_savis_task_get_offers_delegates_and_completes_task() -> None:
    use_case, repository, _queue, offers_use_case = _use_case()
    task_id = uuid7()

    use_case.execute_savis_task(
        task_id,
        SavisTaskType.GET_OFFERS,
        {"search_term": "flour"},
    )

    assert offers_use_case.get_offers_calls == [("flour", task_id)]
    assert repository.completed == [task_id]


def test_execute_savis_task_refresh_offer_delegates_and_completes_task() -> None:
    use_case, repository, _queue, offers_use_case = _use_case()
    task_id = uuid7()
    offer_id = uuid7()

    use_case.execute_savis_task(
        task_id,
        SavisTaskType.REFRESH_OFFER,
        {"offer_id": str(offer_id), "url": "https://example.com"},
    )

    assert offers_use_case.refresh_calls == [
        (offer_id, "https://example.com", task_id),
    ]
    assert repository.completed == [task_id]


def test_list_filters_and_cleanup_delegate_to_repository() -> None:
    task = SavisTask.create(SavisTaskType.GET_OFFERS, {"search_term": "flour"})
    repository = FakeTaskRepository([task])
    use_case, _repository, _queue, _offers_use_case = _use_case(repository=repository)

    tasks, total_items, total_pages = use_case.list(
        SavisTaskStatus.IN_PROGRESS,
        SavisTaskType.GET_OFFERS,
        page=1,
        size=1,
    )

    assert tasks == [task]
    assert total_items == 1
    assert total_pages == 1
    assert repository.filters == [
        (SavisTaskStatus.IN_PROGRESS, SavisTaskType.GET_OFFERS),
    ]
    assert repository.pages == [(1, 1)]
    assert use_case.mark_stale_tasks_failed() == STALE_COUNT
