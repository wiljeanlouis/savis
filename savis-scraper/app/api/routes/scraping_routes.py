"""Scraping routes module for handling web scraping requests.

This module defines FastAPI routes for initiating scraping operations.
"""

from typing import TYPE_CHECKING

from fastapi import APIRouter

from app.api.schemas.scrape_request import ScrapeRequest
from app.api.schemas.scrape_response import ScrapeResponse
from app.application.use_cases.enqueue_scraping import EnqueueScrapingUseCase

if TYPE_CHECKING:
    from app.api.schemas.scrape_request import ScrapeRequest

router = APIRouter()
use_case = EnqueueScrapingUseCase()


@router.post("/scrape")
async def scrape(request: ScrapeRequest) -> ScrapeResponse:
    """Enqueue a scraping request for processing.

    Args:
        request (ScrapeRequest): The scraping request containing ID and search term.

    Returns:
        ScrapeResponse: Response indicating the request was accepted, with status and ID.

    """
    use_case.execute(request.id, request.search_term)
    return ScrapeResponse(status="accepted", id=request.id)
