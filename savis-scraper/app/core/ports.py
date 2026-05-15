"""Ports module."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Offer


class OfferScraper(ABC):
    @abstractmethod
    def scrape_offers(self, search_term: str) -> list[Offer]:
        pass


class TaskQueue(ABC):
    @abstractmethod
    def push_scraping_offers(self, task_id: str, term: str) -> None:
        pass
