"""Tests for executor task use case."""

# ruff: noqa: D101, D102, D103, D107, S101

from datetime import UTC, datetime
from uuid import UUID, uuid7

import pytest

from app.core.models import (
    Offer,
    OfferStatus,
    OfferType,
    Price,
    Provider,
    ProviderName,
    SavisTask,
    SavisTaskStatus,
    SavisTaskType,
)
from app.core.ports import SavisTaskRepository, TaskQueue
from app.core.use_case_savis_tasks import SavisTaskUseCase

STALE_COUNT = 2


class FakeTaskQueue(TaskQueue):
    def __init__(self, *, fail: bool = False) -> None:
        self.fail = fail
        self.get_offer: list[tuple[str, str, str, ProviderName, OfferType]] = []
        self.get_offers: list[tuple[str, str, OfferType]] = []
        self.refreshes: list[tuple[str, str, str]] = []

    def push_get_offer(
        self,
        task_id: str,
        url: str,
        search_term: str,
        provider: ProviderName = ProviderName.MAXI,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        if self.fail:
            msg = "queue unavailable"
            raise RuntimeError(msg)
        self.get_offer.append((task_id, url, search_term, provider, offer_type))

    def push_get_offers(
        self,
        task_id: str,
        search_term: str,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        if self.fail:
            msg = "queue unavailable"
            raise RuntimeError(msg)
        self.get_offers.append((task_id, search_term, offer_type))

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
        *_args: object,
        **_kwargs: object,
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
        self.get_offers_calls: list[tuple[str, UUID, OfferType]] = []
        self.get_offer_calls: list[tuple[str, str, UUID, ProviderName, OfferType]] = []
        self.refresh_calls: list[tuple[UUID, str, UUID]] = []
        self.due_refresh_checks: list[datetime | None] = []
        self.due_offers: list[Offer] = []
        self.covered_search_terms: set[tuple[str, OfferType]] = set()

    def get_offer(
        self,
        url: str,
        search_term: str,
        task_id: UUID,
        provider_name: ProviderName = ProviderName.MAXI,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        self.get_offer_calls.append(
            (url, search_term, task_id, provider_name, offer_type),
        )

    def get_offers(
        self,
        search_term: str,
        task_id: UUID,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        self.get_offers_calls.append((search_term, task_id, offer_type))

    def refresh_offer_by_url(self, offer_id: UUID, url: str, task_id: UUID) -> None:
        self.refresh_calls.append((offer_id, url, task_id))

    def find_due_valid_offers(self, now: datetime | None = None) -> list[Offer]:
        self.due_refresh_checks.append(now)
        return self.due_offers

    def all_providers_have_offers_for_search_term(
        self,
        search_term: str,
        offer_type: OfferType,
    ) -> bool:
        return (search_term, offer_type) in self.covered_search_terms


def _use_case(
    repository: FakeTaskRepository | None = None,
    queue: FakeTaskQueue | None = None,
) -> tuple[SavisTaskUseCase, FakeTaskRepository, FakeTaskQueue, FakeOffersUseCase]:
    task_repository = repository or FakeTaskRepository()
    task_queue = queue or FakeTaskQueue()  # pyright: ignore[reportAbstractUsage]
    offers_use_case = FakeOffersUseCase()
    return (
        SavisTaskUseCase(
            task_queue,
            task_repository,
            offers_use_case,  # pyright: ignore[reportArgumentType]
        ),
        task_repository,
        task_queue,
        offers_use_case,
    )


def test_enqueue_savis_task_get_offers_creates_and_pushes_task() -> None:
    use_case, repository, queue, _offers_use_case = _use_case()

    task = use_case.enqueue_savis_task(
        SavisTaskType.GET_OFFERS,
        {"search_term": "flour", "offer_type": "FOOD"},
    )

    assert task.type == SavisTaskType.GET_OFFERS  # pyright: ignore[reportOptionalMemberAccess]
    assert task.payload == {"search_term": "flour", "offer_type": "FOOD"}  # pyright: ignore[reportOptionalMemberAccess]
    assert task.status == SavisTaskStatus.IN_PROGRESS  # pyright: ignore[reportOptionalMemberAccess]
    assert repository.tasks == [task]
    assert queue.get_offers == [(str(task.id), "flour", OfferType.FOOD)]  # pyright: ignore[reportOptionalMemberAccess]


def test_enqueue_savis_task_get_offer_creates_and_pushes_task() -> None:
    use_case, repository, queue, _offers_use_case = _use_case()
    payload = {
        "search_term": "flour",
        "url": "https://www.maxi.ca/flour/p/12345",
        "provider": "Maxi",
        "offer_type": "MATERIAL",
    }

    task = use_case.enqueue_savis_task(SavisTaskType.GET_OFFER, payload)

    assert task is not None
    assert task.type == SavisTaskType.GET_OFFER
    assert task.payload == payload
    assert repository.tasks == [task]
    assert queue.get_offer == [
        (
            str(task.id),
            payload["url"],
            "flour",
            ProviderName.MAXI,
            OfferType.MATERIAL,
        ),
    ]


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

    assert task.type == SavisTaskType.REFRESH_OFFER  # pyright: ignore[reportOptionalMemberAccess]
    assert task.payload == {  # pyright: ignore[reportOptionalMemberAccess]
        "offer_id": "offer-id",
        "url": "https://example.com/offer",
    }
    assert repository.tasks == [task]
    assert queue.refreshes == [(str(task.id), "offer-id", "https://example.com/offer")]  # pyright: ignore[reportOptionalMemberAccess]


def test_execute_savis_task_get_offers_delegates_and_completes_task() -> None:
    use_case, repository, _queue, offers_use_case = _use_case()
    task_id = uuid7()

    use_case.execute_savis_task(
        task_id,
        SavisTaskType.GET_OFFERS,
        {"search_term": "flour"},
    )

    assert offers_use_case.get_offers_calls == [("flour", task_id, OfferType.FOOD)]
    assert repository.completed == [task_id]


def test_execute_savis_task_get_offer_delegates_and_completes_task() -> None:
    use_case, repository, _queue, offers_use_case = _use_case()
    task_id = uuid7()

    use_case.execute_savis_task(
        task_id,
        SavisTaskType.GET_OFFER,
        {
            "url": "https://www.maxi.ca/flour/p/12345",
            "search_term": "flour",
            "provider": "Maxi",
            "offer_type": "MATERIAL",
        },
    )

    assert offers_use_case.get_offer_calls == [
        (
            "https://www.maxi.ca/flour/p/12345",
            "flour",
            task_id,
            ProviderName.MAXI,
            OfferType.MATERIAL,
        ),
    ]
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


def test_enqueue_due_offer_refresh_tasks_creates_tasks_for_due_offers() -> None:
    use_case, repository, queue, offers_use_case = _use_case()
    now = datetime(2026, 5, 27, 12, 0, tzinfo=UTC)
    due_offer = Offer(
        id=uuid7(),
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label="Flour",
        price=Price("4.99"),
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider(
            ProviderName.MAXI,
            "example",
            "https://example.com",
            "123 Street",
        ),
        status=OfferStatus.VALID,
    )
    offers_use_case.due_offers = [due_offer]

    tasks = use_case.enqueue_due_offer_refresh_tasks(now=now)

    assert offers_use_case.due_refresh_checks == [now]
    assert len(tasks) == 1
    assert repository.tasks == tasks
    assert tasks[0].type == SavisTaskType.REFRESH_OFFER
    assert tasks[0].payload == {
        "offer_id": str(due_offer.id),
        "url": due_offer.url,
    }
    assert queue.refreshes == [(str(tasks[0].id), str(due_offer.id), due_offer.url)]


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
