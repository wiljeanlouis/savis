"""Dependency wiring for Celery tasks."""

from typing import TYPE_CHECKING

from app.container import Container

if TYPE_CHECKING:
    from app.core.ports import ScrapingTaskRepository
    from app.core.use_case_execute_scraping import ExecuteScrapingUseCase
    from app.core.use_case_offers import OffersUseCase


def get_execute_scraping_use_case() -> ExecuteScrapingUseCase:
    """Resolve the scraping use case for Celery tasks."""
    return Container.execute_scraping_use_case()


def get_scraping_task_repository() -> ScrapingTaskRepository:
    """Resolve the scraping task repository for Celery tasks."""
    return Container.scraping_task_repository


def get_offers_use_case() -> OffersUseCase:
    """Resolve the offers use case for Celery tasks."""
    return Container.offers_use_case()
