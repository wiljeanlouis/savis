"""Ports module."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from .models import OfferSortField, SavisTaskSortField, SortDirection

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from .models import Offer, OfferStatus, SavisTask, SavisTaskStatus, SavisTaskType


class OfferProvider(ABC):
    """Port for provider offer retrieval."""

    @abstractmethod
    def get_offers(self, search_term: str) -> list[Offer]:
        """Get offers for a search term."""


class TaskQueue(ABC):
    """Port for background task queues."""

    @abstractmethod
    def push_get_offers(self, task_id: str, search_term: str) -> None:
        """Push a get-offers task to a worker queue."""

    @abstractmethod
    def push_refresh_offer(self, task_id: str, offer_id: str, url: str) -> None:
        """Push an offer refresh task to a worker queue."""


class SavisTaskRepository(ABC):
    """Port for task persistence."""

    @abstractmethod
    def list(
        self,
        status: SavisTaskStatus | None = None,
        task_type: SavisTaskType | None = None,
        page: int = 1,
        size: int = 20,
        sort_by: SavisTaskSortField = SavisTaskSortField.CREATED_AT,
        sort_direction: SortDirection = SortDirection.DESC,
    ) -> tuple[list[SavisTask], int]:
        """List paged tasks and return total count."""

    @abstractmethod
    def save(self, task: SavisTask) -> SavisTask:
        """Save a task."""

    @abstractmethod
    def mark_completed(self, task_id: UUID) -> None:
        """Mark a task as completed."""

    @abstractmethod
    def mark_failed(self, task_id: UUID, error: str) -> None:
        """Mark a task as failed."""

    @abstractmethod
    def mark_stale_in_progress_as_failed(
        self,
        stale_before: datetime,
        error: str,
    ) -> int:
        """Mark stale in-progress scraping tasks as failed."""


class OfferRepository(ABC):
    """Port for offer persistence."""

    @abstractmethod
    def find_by_provider_and_external_id(
        self,
        provider: str,
        external_id: str,
    ) -> Offer | None:
        """Find an offer by its stable provider identity."""

    @abstractmethod
    def find_by_id(self, offer_id: UUID) -> Offer | None:
        """Find an offer by id."""

    @abstractmethod
    def list(
        self,
        status: OfferStatus | None,
        page: int,
        size: int,
        sort_by: OfferSortField = OfferSortField.LAST_RETRIEVED_AT,
        sort_direction: SortDirection = SortDirection.DESC,
    ) -> tuple[list[Offer], int]:
        """List paged offers and return total count."""

    @abstractmethod
    def save(self, offer: Offer) -> Offer:
        """Save an offer."""


class OfferPublisher(ABC):
    """Port for publishing offers outside the executor."""

    @abstractmethod
    def publish_offer(self, offer: Offer) -> None:
        """Publish one offer."""
