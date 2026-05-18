"""RabbitMQ publisher for scraping results."""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any

from fastapi.encoders import jsonable_encoder
from pika import BasicProperties, BlockingConnection, URLParameters

from app.config import EnvParams
from app.core.ports import OfferPublisher

logger = logging.getLogger(__name__)

QUEUE_NAME = "savis.offer.results"

if TYPE_CHECKING:
    from app.core.models import Offer


class RabbitMqResultPublisher(OfferPublisher):
    """Publish successful scraping results to RabbitMQ."""

    def publish_success(self, payload: dict[str, Any]) -> None:
        """Publish scraped offers to the offer results queue."""
        json_payload = json.dumps(jsonable_encoder(payload))
        logger.info(
            "[PUBLISH] Sending results to RabbitMQ | scraping_task_id={%s}",
            payload.get("id"),
        )
        with BlockingConnection(URLParameters(EnvParams.RABBIT_MQ_URL)) as connection:
            channel = connection.channel()
            channel.queue_declare(
                queue=QUEUE_NAME,
                durable=True,
                arguments={"x-queue-type": "classic"},
            )
            channel.basic_publish(
                exchange="",
                routing_key=QUEUE_NAME,
                body=json_payload,
                properties=BasicProperties(delivery_mode=2),
            )

    def publish_offer(self, offer: Offer) -> None:
        """Publish one offer to the offer results queue."""
        self.publish_success({"id": str(offer.id), "offers": [offer]})
