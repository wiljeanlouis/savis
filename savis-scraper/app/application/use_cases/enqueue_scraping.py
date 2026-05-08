"""Enqueue task use case."""

from app.workers.scraping_tasks import scrape_multi_site


class EnqueueScrapingUseCase:
    """Use case for enqueuing a scraping task."""

    def execute(self, task_id: int, term: str) -> None:
        """Exexute the scraping task.

        Args:
            task_id (int): the received id of the task
            term (str): the term to search

        """
        scrape_multi_site.delay(task_id, term)  # type: ignore[attr-defined]
