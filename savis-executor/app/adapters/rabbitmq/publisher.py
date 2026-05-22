"""RabbitMQ publisher for offer results."""

from __future__ import annotations

import json
import logging
from typing import TYPE_CHECKING, Any

from fastapi.encoders import jsonable_encoder
from pika import BasicProperties, BlockingConnection, URLParameters

from app.config import EnvParams
from app.core.ports import OfferPublisher

logger = logging.getLogger(__name__)

RESULT_QUEUE_NAME = "savis.offer.results"
INVALIDATION_QUEUE_NAME = "savis.offer.invalidations"

if TYPE_CHECKING:
    from app.core.models import Offer


class RabbitMqResultPublisher(OfferPublisher):
    """Publish successful offer results to RabbitMQ."""

    def publish_payload(self, queue_name: str, payload: dict[str, Any]) -> None:
        """Publish a payload to a durable queue."""
        json_payload = json.dumps(jsonable_encoder(payload))
        with BlockingConnection(URLParameters(EnvParams.RABBIT_MQ_URL)) as connection:
            channel = connection.channel()
            channel.queue_declare(
                queue=queue_name,
                durable=True,
                arguments={"x-queue-type": "classic"},
            )
            channel.basic_publish(
                exchange="",
                routing_key=queue_name,
                body=json_payload,
                properties=BasicProperties(
                    delivery_mode=2,
                    content_type="application/json",
                ),
            )

    def publish_success(self, payload: dict[str, Any]) -> None:
        """Publish scraped offers to the offer results queue."""
        logger.info(
            "[PUBLISH] Sending results to RabbitMQ | offer_id={%s}",
            payload.get("id"),
        )
        self.publish_payload(RESULT_QUEUE_NAME, payload)

    def publish_offer(self, offer: Offer) -> None:
        """Publish one offer to the offer results queue."""
        self.publish_success({"id": str(offer.id), "offers": [offer]})

    def publish_offer_invalidation(self, offer: Offer) -> None:
        """Publish that a previously valid offer should be invalidated."""
        logger.info("[PUBLISH] Sending offer invalidation | offer_id={%s}", offer.id)
        self.publish_payload(
            INVALIDATION_QUEUE_NAME,
            {
                "id": None if offer.id is None else str(offer.id),
                "external_id": offer.external_id,
                "provider_identifier": offer.provider.identifier,
            },
        )
