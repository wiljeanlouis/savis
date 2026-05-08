"""Aggregate results from multiple scraping operations."""

from app.infrastructure.aggregator.offer_aggregator import OfferAggregator


class AggregateResultsUseCase:
    def __init__(self) -> None:
        self.aggregator = OfferAggregator()

    def execute(self, results: list[list[dict]]) -> list[dict]:
        return self.aggregator.aggregate(results)
