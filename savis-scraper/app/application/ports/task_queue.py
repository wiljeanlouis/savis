"""Task Queue port."""

from abc import ABC, abstractmethod


class TaskQueue(ABC):
    @abstractmethod
    def push(self, task_id: int, term: str) -> None:
        pass
