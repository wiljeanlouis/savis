from pydantic import BaseModel


class ScrapeResponse(BaseModel):
    status: str
    id: int
