"""Schema definitions for scrape request payloads."""

from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    """Schema for scrape request payload."""

    id: int
    search_term: str
