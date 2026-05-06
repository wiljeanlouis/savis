from pydantic import BaseModel


class ScrapingTask(BaseModel):
    id: int
    searchTerm: str
