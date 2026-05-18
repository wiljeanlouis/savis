"""Tests for execute scraping use case."""

# ruff: noqa: D101, D102, D103, S101

import pytest

from app.core.models import Offer, Provider
from app.core.ports import OfferScraper
from app.core.use_case_execute_scraping import (
    ExecuteScrapingUseCase,
    ScrapingFailedError,
)


def _offer(label: str) -> Offer:
    return Offer(
        external_id="external-id",
        url="https://example.com/offer",
        brand="Example",
        label=label,
        price=None,
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider(
            name="Example Provider",
            identifier="example",
            site="https://example.com",
            address="123 Example Street",
        ),
    )


class SuccessfulScraper(OfferScraper):
    def scrape_offers(self, search_term: str) -> list[Offer]:
        return [_offer(f"{search_term}-offer")]


class EmptyScraper(OfferScraper):
    def scrape_offers(self, search_term: str) -> list[Offer]:  # noqa: ARG002
        return []


class FailingScraper(OfferScraper):
    def scrape_offers(self, search_term: str) -> list[Offer]:
        msg = f"{search_term} timed out"
        raise TimeoutError(msg)


def test_scrape_offers_raises_when_all_providers_fail() -> None:
    use_case = ExecuteScrapingUseCase([FailingScraper()])

    with pytest.raises(ScrapingFailedError, match="All provider scrapers failed"):
        use_case.scrape_offers("farine")


def test_scrape_offers_returns_successful_provider_results_when_some_fail() -> None:
    use_case = ExecuteScrapingUseCase([FailingScraper(), SuccessfulScraper()])

    offers = use_case.scrape_offers("farine")

    assert [offer.label for offer in offers] == ["farine-offer"]


def test_scrape_offers_allows_successful_empty_results() -> None:
    use_case = ExecuteScrapingUseCase([EmptyScraper()])

    offers = use_case.scrape_offers("unknown-product")

    assert offers == []
