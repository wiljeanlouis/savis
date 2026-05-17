"""Dependency wiring for Celery tasks."""

from typing import TYPE_CHECKING

from app.container import Container

if TYPE_CHECKING:
    from app.adapters.java_api_publisher import JavaApiPublisher
    from app.core.execute_scraping_use_case import ExecuteScrapingUseCase
    from app.core.ports import ScrapingTaskRepository


def get_execute_scraping_use_case() -> ExecuteScrapingUseCase:
    """Resolve the scraping use case for Celery tasks."""
    return Container.execute_scraping_use_case()


def get_java_api_publisher() -> JavaApiPublisher:
    """Resolve the publisher for Celery tasks."""
    return Container.java_api_publisher


def get_scraping_task_repository() -> ScrapingTaskRepository:
    """Resolve the scraping task repository for Celery tasks."""
    return Container.scraping_task_repository
