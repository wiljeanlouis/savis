"""Scraping routes module for handling web scraping requests.

This module defines FastAPI routes for initiating scraping operations.
"""

from fastapi import APIRouter

from app.adapters.api.schemas import (
    ScrapeRequest,
    ScrapeResponse,
    ScrapingTaskResponse,
)
from app.container import Container
from app.core.models import ScrapingTaskStatus  # noqa: TC001

router = APIRouter()
enqueue_use_case = Container.enqueue_scraping_use_case()
scraping_tasks_use_case = Container.scraping_tasks_use_case()


@router.post("/scrape/offers")
async def scrape_offers(request: ScrapeRequest) -> ScrapeResponse:
    """Enqueue a scraping offers request for processing.

    Args:
        request (ScrapeRequest): The scraping request containing ID and search term.

    Returns:
        ScrapeResponse: Response indicating the request was accepted.

    """
    task = enqueue_use_case.scrape_offers(request.search_term)
    return ScrapeResponse(
        status="accepted",
        search_term=request.search_term,
        task_id=str(task.id),
    )


@router.get("/scrape/tasks")
async def list_scraping_tasks(
    status: ScrapingTaskStatus | None = None,
) -> list[ScrapingTaskResponse]:
    """List scraping tasks, optionally filtered by status."""
    tasks = scraping_tasks_use_case.list(status)
    return [
        ScrapingTaskResponse(
            id=str(task.id),
            search_term=task.search_term,
            status=task.status,
            created_at=task.created_at,
            updated_at=task.updated_at,
            completed_at=task.completed_at,
            error_message=task.error_message,
        )
        for task in tasks
    ]
