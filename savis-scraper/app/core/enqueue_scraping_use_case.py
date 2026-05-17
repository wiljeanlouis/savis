"""Enqueue task use case."""

from typing import TYPE_CHECKING

from app.core.models import ScrapingTask

if TYPE_CHECKING:
    from .ports import ScrapingTaskRepository, TaskQueue


class EnqueueScrapingUseCase:
    """Use case for enqueuing a scraping task."""

    task_queue: TaskQueue
    scraping_task_repository: ScrapingTaskRepository

    def __init__(
        self,
        task_queue: TaskQueue,
        scraping_task_repository: ScrapingTaskRepository,
    ) -> None:
        """Initialize the use case."""
        self.task_queue = task_queue
        self.scraping_task_repository = scraping_task_repository

    def scrape_offers(self, term: str) -> ScrapingTask:
        """Send the scraping task to a task worker.

        Args:
            term (str): the term to search

        """
        task = self.scraping_task_repository.save(ScrapingTask.create(term))

        try:
            self.task_queue.push_scraping_offers(str(task.id), term)
        except Exception as exc:
            self.scraping_task_repository.mark_failed(task.id, str(exc))
            raise

        return task
