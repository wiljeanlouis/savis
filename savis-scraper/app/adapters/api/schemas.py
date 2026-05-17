"""Schema definitions for scraping API payloads."""

from datetime import datetime  # noqa: TC003

from pydantic import BaseModel

from app.core.models import ScrapingTaskStatus  # noqa: TC001


class ScrapeRequest(BaseModel):
    """Schema for scrape request payload."""

    search_term: str


class ScrapeResponse(BaseModel):
    """Schema for scrape operation response.

    Attributes:
        status: The status of the scrape operation.
        id: The unique identifier for the scrape operation.

    """

    status: str
    search_term: str
    task_id: str


class ScrapingTaskResponse(BaseModel):
    """Schema for a scraping task response."""

    id: str
    search_term: str
    status: ScrapingTaskStatus
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    error_message: str | None
