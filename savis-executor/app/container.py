"""Dependency container for the executor application."""

from app.adapters.celery.celery_queue import CeleryQueue
from app.adapters.database.offer_repository import SqlAlchemyOfferRepository
from app.adapters.database.savis_task_repository import SqlAlchemySavisTaskRepository
from app.adapters.rabbitmq.publisher import RabbitMqResultPublisher
from app.adapters.scrapers import load_offer_providers
from app.core.use_case_offers import OffersUseCase
from app.core.use_case_savis_tasks import SavisTaskUseCase


class Container:
    """Composition root for executor dependencies."""

    celery_queue = CeleryQueue()
    result_publisher = RabbitMqResultPublisher()
    savis_task_repository = SqlAlchemySavisTaskRepository()
    offer_repository = SqlAlchemyOfferRepository()

    @classmethod
    def offers_use_case(cls) -> OffersUseCase:
        """Build the offers use case."""
        return OffersUseCase(
            cls.offer_repository,
            cls.result_publisher,
            load_offer_providers(),
        )

    @classmethod
    def savis_task_use_case(cls) -> SavisTaskUseCase:
        """Build the task use case."""
        return SavisTaskUseCase(
            cls.celery_queue,
            cls.savis_task_repository,
            cls.offers_use_case(),
        )
