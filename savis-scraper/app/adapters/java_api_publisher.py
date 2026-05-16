"""Publisher for reporting scraping results to the Java API."""

import logging

import httpx
from fastapi.encoders import jsonable_encoder

from app.config import EnvParams

logger = logging.getLogger(__name__)


class JavaApiPublisher:
    """Publish scraping task outcomes to the Java backend."""

    def publish_success(self, payload: dict) -> None:
        """Send scraped offers to the Java backend."""
        json_payload = jsonable_encoder(payload)
        logger.info(
            "[PUBLISH] Sending results to Java | scraping_task_id={%s}",
            payload.get("id"),
        )
        with httpx.Client() as client:
            client.post(
                f"{EnvParams.JAVA_API_URL}/v1/supply/offers",
                json=json_payload,
            )

    def publish_failure(self, scraping_task_id: str, error: str) -> None:
        """Send a scraping task failure to the Java backend."""
        payload = {"id": scraping_task_id, "error": error}
        json_payload = jsonable_encoder(payload)
        logger.info(
            "[PUBLISH] Sending failure to Java | scraping_task_id={%s}",
            payload.get("id"),
        )
        with httpx.Client() as client:
            client.patch(
                f"{EnvParams.JAVA_API_URL}/v1/supply/task/failure",
                json=json_payload,
            )
