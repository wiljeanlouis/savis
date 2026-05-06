from fastapi import APIRouter
from app.application.use_cases.enqueue_scraping import EnqueueScrapingUseCase
from app.api.schemas.scrape_request import ScrapeRequest
from app.api.schemas.scrape_response import ScrapeResponse

router = APIRouter()
use_case = EnqueueScrapingUseCase()


@router.post("/scrape")
async def scrape(request: ScrapeRequest):
    use_case.execute(request.id, request.searchTerm)
    return ScrapeResponse(status="accepted", id=request.id)
