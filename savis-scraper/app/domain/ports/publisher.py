"""Publisher port definitions for event publishing."""

from abc import ABC, abstractmethod


class Publisher(ABC):
    @abstractmethod
    async def publish(self, payload: dict):
        pass
