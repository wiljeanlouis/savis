"""Schema definitions for scrape request payloads."""

from pydantic import BaseModel


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
