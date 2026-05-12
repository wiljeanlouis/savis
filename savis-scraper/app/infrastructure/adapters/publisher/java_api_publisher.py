import logging

import httpx
from fastapi.encoders import jsonable_encoder

from app.application.ports.offer_publisher import OfferPublisher
from app.infrastructure.config.settings import settings

logger = logging.getLogger(__name__)


class JavaApiPublisher(OfferPublisher):
    def publish(self, payload: dict):

        json_payload = jsonable_encoder(payload)
        logger.info(
            "[PUBLISH] Sending results to Java | task_id={%s}",
            payload.get("id"),
        )
        with httpx.Client() as client:
            client.post(
                f"{settings.JAVA_API_URL}/v1/supply/offers",
                json=json_payload,
            )
