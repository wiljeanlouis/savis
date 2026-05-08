"""Receive task for celery worker."""

from app.application.ports.task_queue import TaskQueue
from app.infrastructure.entrypoints.worker.tasks.scraping_tasks import scrape_task


class CeleryQueue(TaskQueue):
    """Use case for enqueuing a scraping task."""

    def push(self, task_id: int, term: str) -> None:
        """Del the scraping task.

        Args:
            task_id (int): the received id of the task
            term (str): the term to search

        """
        scrape_task.delay(task_id, term)  # type: ignore[attr-defined]
