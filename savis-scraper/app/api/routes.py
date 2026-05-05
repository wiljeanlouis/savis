from fastapi import APIRouter, BackgroundTasks
from app.schemas.scraping_task import ScrapingTask
from app.scrapers.engine import run_scraper

router = APIRouter(prefix="/api/v1")


@router.post("/scrape")
async def trigger_scrape(task: ScrapingTask, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_scraper, task)
    return {"status": "in_progress", "id": task.id}
