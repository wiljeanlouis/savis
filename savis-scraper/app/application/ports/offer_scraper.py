"""Scraper port."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models import Offer


class OfferScraper(ABC):
    @abstractmethod
    def scrape(self, search_term: str) -> list[Offer]:
        pass
