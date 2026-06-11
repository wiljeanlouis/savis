"""Celery task queue."""

from app.adapters.celery.celery_app import celery_app
from app.core.models import OfferType, ProviderName
from app.core.ports import TaskQueue

GET_OFFER_TASK_NAME = "app.adapters.celery.celery_tasks.get_offer_task"
GET_OFFERS_TASK_NAME = "app.adapters.celery.celery_tasks.get_offers_task"
REFRESH_OFFER_TASK_NAME = "app.adapters.celery.celery_tasks.refresh_offer_task"


class CeleryQueue(TaskQueue):
    """Adapter for enqueuing scraping tasks."""

    def push_get_offer(
        self,
        task_id: str,
        url: str,
        search_term: str,
        provider: ProviderName = ProviderName.MAXI,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        """Send get-offer task to Celery."""
        celery_app.send_task(
            GET_OFFER_TASK_NAME,
            args=(task_id, url, search_term, provider.value, offer_type.value),
        )

    def push_get_offers(
        self,
        task_id: str,
        search_term: str,
        offer_type: OfferType = OfferType.FOOD,
    ) -> None:
        """Send get-offers task to Celery."""
        celery_app.send_task(
            GET_OFFERS_TASK_NAME,
            args=(task_id, search_term, offer_type.value),
        )

    def push_refresh_offer(self, task_id: str, offer_id: str, url: str) -> None:
        """Send offer refresh task to Celery."""
        celery_app.send_task(REFRESH_OFFER_TASK_NAME, args=(task_id, offer_id, url))
