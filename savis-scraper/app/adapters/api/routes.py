"""Scraping routes module for handling web scraping requests.

This module defines FastAPI routes for initiating scraping operations.
"""

from fastapi import APIRouter

from app.adapters.api.schemas import ScrapeRequest, ScrapeResponse
from app.adapters.celery.celery_queue import CeleryQueue
from app.core.enqueue_scraping_use_case import EnqueueScrapingUseCase

router = APIRouter()
celery_queue = CeleryQueue()
use_case = EnqueueScrapingUseCase(celery_queue)


@router.post("/scrape/offers")
async def scrape_offers(request: ScrapeRequest) -> ScrapeResponse:
    """Enqueue a scraping offers request for processing.

    Args:
        request (ScrapeRequest): The scraping request containing ID and search term.

    Returns:
        ScrapeResponse: Response indicating the request was accepted.

    """
    use_case.scrape_offers(request.id, request.search_term)
    return ScrapeResponse(status="accepted", id=request.id)
