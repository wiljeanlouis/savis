from abc import ABC, abstractmethod
from app.domain.models.offer import Offer


class Scraper(ABC):

    @abstractmethod
    async def search(self, search_term: str) -> list[Offer]:
        pass
