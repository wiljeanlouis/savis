import logging

import httpx
from fastapi.encoders import jsonable_encoder

from app.infrastructure.config.env_params import env_params

logger = logging.getLogger(__name__)


class JavaApiPublisher:
    def publish_success(self, payload: dict) -> None:

        json_payload = jsonable_encoder(payload)
        logger.info(
            "[PUBLISH] Sending results to Java | scraping_task_id={%s}",
            payload.get("id"),
        )
        with httpx.Client() as client:
            client.post(
                f"{env_params.JAVA_API_URL}/v1/supply/offers",
                json=json_payload,
            )

    def publish_failure(self, scraping_task_id: str, error: str) -> None:
        payload = {"id": scraping_task_id, "error": error}
        json_payload = jsonable_encoder(payload)
        logger.info(
            "[PUBLISH] Sending failure to Java | scraping_task_id={%s}",
            payload.get("id"),
        )
        with httpx.Client() as client:
            client.patch(
                f"{env_params.JAVA_API_URL}/v1/supply/task/failure",
                json=json_payload,
            )
