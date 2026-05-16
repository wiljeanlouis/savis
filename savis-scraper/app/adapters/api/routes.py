"""Scraping routes module for handling web scraping requests.

This module defines FastAPI routes for initiating scraping operations.
"""

from fastapi import APIRouter

from app.adapters.api.schemas import ScrapeRequest, ScrapeResponse
from app.container import Container

router = APIRouter()
use_case = Container.enqueue_scraping_use_case()


@router.post("/scrape/offers")
async def scrape_offers(request: ScrapeRequest) -> ScrapeResponse:
    """Enqueue a scraping offers request for processing.

    Args:
        request (ScrapeRequest): The scraping request containing ID and search term.

    Returns:
        ScrapeResponse: Response indicating the request was accepted.

    """
    use_case.scrape_offers(request.search_term)
    return ScrapeResponse(status="accepted", search_term=request.search_term)
