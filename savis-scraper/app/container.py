"""Dependency container for the scraper application."""

from app.adapters.celery.celery_queue import CeleryQueue
from app.adapters.database.scraping_task_repository import (
    SqlAlchemyScrapingTaskRepository,
)
from app.adapters.database.tracked_offer_repository import (
    SqlAlchemyTrackedOfferRepository,
)
from app.adapters.rabbitmq.publisher import RabbitMqResultPublisher
from app.adapters.scrapers import load_scrapers
from app.core.use_case_enqueue_scraping import EnqueueScrapingUseCase
from app.core.use_case_execute_scraping import ExecuteScrapingUseCase
from app.core.use_case_scraping_tasks import ScrapingTasksUseCase
from app.core.use_case_track_offers import TrackOffersUseCase


class Container:
    """Composition root for scraper dependencies."""

    celery_queue = CeleryQueue()
    result_publisher = RabbitMqResultPublisher()
    scraping_task_repository = SqlAlchemyScrapingTaskRepository()
    tracked_offer_repository = SqlAlchemyTrackedOfferRepository()

    @classmethod
    def enqueue_scraping_use_case(cls) -> EnqueueScrapingUseCase:
        """Build the enqueue scraping use case."""
        return EnqueueScrapingUseCase(
            cls.celery_queue,
            cls.scraping_task_repository,
        )

    @classmethod
    def execute_scraping_use_case(cls) -> ExecuteScrapingUseCase:
        """Build the execute scraping use case."""
        scrapers = load_scrapers()
        return ExecuteScrapingUseCase(scrapers)

    @classmethod
    def scraping_tasks_use_case(cls) -> ScrapingTasksUseCase:
        """Build the scraping tasks use case."""
        return ScrapingTasksUseCase(cls.scraping_task_repository)

    @classmethod
    def track_offers_use_case(cls) -> TrackOffersUseCase:
        """Build the track offers use case."""
        return TrackOffersUseCase(cls.tracked_offer_repository)
