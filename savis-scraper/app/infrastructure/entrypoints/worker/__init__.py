"""Workers module."""

from .tasks.scraping_tasks import scrape_task

__all__ = ["scrape_task"]
