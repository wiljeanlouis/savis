"""Celery task queue that receives tasks for celery worker."""

from app.core.ports import TaskQueue

from .celery_tasks import scrape_offers_task


class CeleryQueue(TaskQueue):
    """Adaptor for enqueuing a scraping task."""

    def push_scraping_offers(self, task_id: str, term: str) -> None:
        """Del the scraping task.

        Args:
            task_id (int): the received id of the task
            term (str): the term to search

        """
        scrape_offers_task.delay(task_id, term)  # type: ignore[attr-defined]
