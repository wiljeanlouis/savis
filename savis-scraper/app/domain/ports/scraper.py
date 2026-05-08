"""Scraper port definitions for scraping."""

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING

# from app.domain.models.offer import Offer

if TYPE_CHECKING:
    from app.domain.models.offer import Offer


class Scraper(ABC):
    @abstractmethod
    async def search(self, search_term: str) -> list[Offer]:
        pass
