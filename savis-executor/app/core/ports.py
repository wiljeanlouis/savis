"""Ports module."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

from .models import (
    OfferSortField,
    OfferType,
    ProviderName,
    SavisTaskSortField,
    SortDirection,
)

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from .models import (
        Offer,
        OfferStatus,
        SavisTask,
        SavisTaskStatus,
        SavisTaskType,
    )


class OfferProviderNonRetryableError(RuntimeError):
    """Raised when retrying an offer provider immediately would not help."""


class OfferProviderBlockedError(OfferProviderNonRetryableError):
    """Raised when an offer provider explicitly blocks collection."""


class ActiveRefreshTaskAlreadyExistsError(RuntimeError):
    """Raised when one active refresh task already exists for an offer."""


class ProviderCircuitOpenError(OfferProviderNonRetryableError):
    """Raised when provider access is suspended after previous blocks."""


class ProviderAccessPolicy(ABC):
    """Control provider request pacing and circuit-breaker state."""

    @abstractmethod
    def wait_for_request(self, provider_identifier: str) -> None:
        """Wait until one provider request is allowed or reject it."""

    @abstractmethod
    def record_success(self, provider_identifier: str) -> None:
        """Record one successful provider request."""

    @abstractmethod
    def record_block(self, provider_identifier: str) -> None:
        """Record one provider block and open its circuit."""


class OfferProvider(ABC):
    """Port for provider offer retrieval."""

    @abstractmethod
    def get_offer_by_url(self, url: str) -> Offer | None:
        """Get offer from provided url."""

    @abstractmethod
    def get_offers(self, search_term: str) -> list[Offer]:
        """Get offers for a search term."""


class TaskQueue(ABC):
    """Port for background task queues."""

    @abstractmethod
    def push_get_offer(
        self,
        task_id: str,
        url: str,
        search_term: str,
        provider: ProviderName = ProviderName.MAXI,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        """Push a  get-offer task to a worker queue."""

    @abstractmethod
    def push_get_offers(
        self,
        task_id: str,
        search_term: str,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        """Push a get-offers task to a worker queue."""

    @abstractmethod
    def push_refresh_offer(self, task_id: str, offer_id: str, url: str) -> None:
        """Push an offer refresh task to a worker queue."""


class SavisTaskRepository(ABC):
    """Port for task persistence."""

    @abstractmethod
    def list(  # noqa: PLR0913
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
    def has_active_refresh_offer_task(self, offer_id: UUID) -> bool:
        """Return whether an offer already has an active refresh task."""

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
    def list(  # noqa: PLR0913
        self,
        status: OfferStatus | None,
        page: int,
        size: int,
        sort_by: OfferSortField = OfferSortField.LAST_RETRIEVED_AT,
        sort_direction: SortDirection = SortDirection.DESC,
        offer_type: OfferType | None = None,
        search_term: str | None = None,
    ) -> tuple[list[Offer], int]:
        """List paged offers and return total count."""

    @abstractmethod
    def search_term_facets(
        self,
        status: OfferStatus | None = None,
        offer_type: OfferType | None = None,
    ) -> list[tuple[str, int]]:
        """Count offers grouped by search term."""

    @abstractmethod
    def find_due_for_refresh(self, now: datetime) -> list[Offer]:
        """Find valid offers whose refresh time is due."""

    @abstractmethod
    def provider_identifiers_for_search_term(
        self,
        search_term: str,
        offer_type: OfferType,
    ) -> set[str]:
        """Return provider identifiers with offers for a search term and type."""

    @abstractmethod
    def save(self, offer: Offer) -> Offer:
        """Save an offer."""

    @abstractmethod
    def delete(self, offer_id: UUID) -> bool:
        """Delete an offer and return whether it existed."""


class OfferPublisher(ABC):
    """Port for publishing offers outside the executor."""

    @abstractmethod
    def publish_offer(self, offer: Offer) -> None:
        """Publish one offer."""

    @abstractmethod
    def publish_offer_invalidation(self, offer: Offer) -> None:
        """Publish that a previously valid offer is no longer usable."""
