"""Workers module."""

from .tasks.scraping_tasks import scrape_offers_task

__all__ = ["scrape_offers_task"]
