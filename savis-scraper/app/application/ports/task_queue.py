"""Task Queue port."""

from abc import ABC, abstractmethod


class TaskQueue(ABC):
    @abstractmethod
    def push_scraping_offers(self, task_id: int, term: str) -> None:
        pass
