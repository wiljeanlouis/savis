"""Scraping routes module for handling web scraping requests.

This module defines FastAPI routes for initiating scraping operations.
"""

from fastapi import APIRouter

from app.application.use_cases.enqueue_scraping import EnqueueScrapingUseCase
from app.infrastructure.adapters.queue.celery_queue import CeleryQueue
from app.infrastructure.entrypoints.api.schemas.scrape_request import (
    ScrapeRequest,  # noqa: TC001
)
from app.infrastructure.entrypoints.api.schemas.scrape_response import ScrapeResponse

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
