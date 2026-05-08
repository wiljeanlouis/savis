"""Response model for scrape API endpoints."""

from pydantic import BaseModel


class ScrapeResponse(BaseModel):
    """Schema for scrape operation response.

    Attributes:
        status: The status of the scrape operation.
        id: The unique identifier for the scrape operation.

    """

    status: str
    id: int
