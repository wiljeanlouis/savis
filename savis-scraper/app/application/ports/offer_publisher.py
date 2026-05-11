"""Offer publisher port."""

from abc import ABC, abstractmethod


class OfferPublisher(ABC):
    @abstractmethod
    def publish(self, payload: dict):
        pass
