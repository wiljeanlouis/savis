"""Dependency wiring for Celery tasks."""

from typing import TYPE_CHECKING

from app.container import Container

if TYPE_CHECKING:
    from app.adapters.rabbitmq.publisher import RabbitMqResultPublisher
    from app.core.ports import ScrapingTaskRepository
    from app.core.use_case_execute_scraping import ExecuteScrapingUseCase


def get_execute_scraping_use_case() -> ExecuteScrapingUseCase:
    """Resolve the scraping use case for Celery tasks."""
    return Container.execute_scraping_use_case()


def get_result_publisher() -> RabbitMqResultPublisher:
    """Resolve the publisher for Celery tasks."""
    return Container.result_publisher


def get_scraping_task_repository() -> ScrapingTaskRepository:
    """Resolve the scraping task repository for Celery tasks."""
    return Container.scraping_task_repository
