"""Ports module."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from uuid import UUID

    from .models import Offer, ScrapingTask


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


class ScrapingTaskRepository(ABC):
    """Port for scraping task persistence."""

    @abstractmethod
    def save(self, task: ScrapingTask) -> ScrapingTask:
        """Save a scraping task."""

    @abstractmethod
    def mark_completed(self, task_id: UUID) -> None:
        """Mark a scraping task as completed."""

    @abstractmethod
    def mark_failed(self, task_id: UUID, error: str) -> None:
        """Mark a scraping task as failed."""
