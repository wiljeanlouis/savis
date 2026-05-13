"""Schema definitions for scrape request payloads."""

from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    """Schema for scrape request payload."""

    id: str
    search_term: str
