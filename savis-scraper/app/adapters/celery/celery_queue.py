"""Celery task queue."""

from app.adapters.celery.celery_app import celery_app
from app.core.ports import TaskQueue

SCRAPE_OFFERS_TASK_NAME = "app.adapters.celery.celery_tasks.scrape_offers_task"


class CeleryQueue(TaskQueue):
    """Adapter for enqueuing scraping tasks."""

    def push_scraping_offers(self, task_id: str, term: str) -> None:
        """Send scraping task to Celery."""
        celery_app.send_task(SCRAPE_OFFERS_TASK_NAME, args=(task_id, term))
