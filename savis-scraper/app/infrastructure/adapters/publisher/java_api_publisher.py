import logging

from fastapi.encoders import jsonable_encoder

from app.application.ports.offer_publisher import OfferPublisher

from .http_client import RETRY_MAX_ATTEMPT as RETRY
from .http_client import http_client

logger = logging.getLogger(__name__)


class JavaApiPublisher(OfferPublisher):
    def publish(self, payload: dict):
        json_payload = jsonable_encoder(payload)

        for attempt in range(RETRY):
            logger.info(
                "[PUBLISH] Sending results to Java | task_id={%s} | attempt %s/%s",
                payload.get("id"),
                attempt + 1,
                RETRY,
            )
            try:
                response = http_client.post(
                    "/v1/supply/offers",
                    json=json_payload,
                )
                response.raise_for_status()
            except Exception:
                if attempt == (RETRY - 1):
                    raise
            else:
                return
