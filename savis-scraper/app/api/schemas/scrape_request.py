from pydantic import BaseModel


class ScrapeRequest(BaseModel):
    id: int
    searchTerm: str
