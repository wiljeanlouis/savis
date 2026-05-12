"""Enqueue task use case."""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.application.ports.task_queue import TaskQueue


class EnqueueScrapingUseCase:
    """Use case for enqueuing a scraping task."""

    task_queue: TaskQueue

    def __init__(self, task_queue: TaskQueue) -> None:
        self.task_queue = task_queue

    def scrape_offers(self, task_id: int, term: str) -> None:
        """Send the scraping task to a task worker.

        Args:
            task_id (int): the received id of the task
            term (str): the term to search

        """
        self.task_queue.push_scraping_offers(task_id, term)
