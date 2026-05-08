"""Scraper port."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.models import Offer


class OfferScraper(ABC):
    @abstractmethod
    async def search(self, search_term: str) -> list[Offer]:
        pass
