"""Task Queue port."""

from abc import ABC, abstractmethod


class TaskQueue(ABC):
    @abstractmethod
    def push_scraping_offers(self, task_id: str, term: str) -> None:
        pass
