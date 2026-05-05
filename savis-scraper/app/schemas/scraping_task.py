from pydantic import BaseModel
from typing import Optional


class ScrapingTask(BaseModel):
    id: int
    searchTerm: str
