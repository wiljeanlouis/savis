"""Ports module."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from datetime import datetime
    from uuid import UUID

    from .models import Offer, OfferStatus, ScrapingTask, ScrapingTaskStatus


class OfferScraper(ABC):
    """Port for provider offer scrapers."""

    @abstractmethod
    def scrape_offers(self, search_term: str) -> list[Offer]:
        """Scrape offers for a search term."""


class TaskQueue(ABC):
    """Port for background task queues."""

    @abstractmethod
    def push_scraping_offers(self, task_id: str, term: str) -> None:
        """Push a scraping task to a worker queue."""

    @abstractmethod
    def push_refresh_offer(self, offer_id: str, url: str) -> None:
        """Push an offer refresh task to a worker queue."""


class ScrapingTaskRepository(ABC):
    """Port for scraping task persistence."""

    @abstractmethod
    def list(self, status: ScrapingTaskStatus | None = None) -> list[ScrapingTask]:
        """List scraping tasks, optionally filtered by status."""

    @abstractmethod
    def save(self, task: ScrapingTask) -> ScrapingTask:
        """Save a scraping task."""

    @abstractmethod
    def mark_completed(self, task_id: UUID) -> None:
        """Mark a scraping task as completed."""

    @abstractmethod
    def mark_failed(self, task_id: UUID, error: str) -> None:
        """Mark a scraping task as failed."""

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
    ) -> tuple[list[Offer], int]:
        """List paged offers and return total count."""

    @abstractmethod
    def save(self, offer: Offer) -> Offer:
        """Save an offer."""


class OfferPublisher(ABC):
    """Port for publishing offers outside the scraper."""

    @abstractmethod
    def publish_offer(self, offer: Offer) -> None:
        """Publish one offer."""
