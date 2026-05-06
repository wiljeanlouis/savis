import httpx
import logging
from fastapi.encoders import jsonable_encoder
from app.config.settings import settings

logger = logging.getLogger(__name__)


class JavaApiPublisher:

    async def publish(self, payload: dict):
        logger.info(f"[PUBLISH] Sending results to Java | task_id={payload.get("id")}")
        json_payload = jsonable_encoder(payload)
        logger.info(f"[PUBLISH] Payload | task_id={json_payload}")
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.JAVA_API_URL}/v1/supply/offers", json=json_payload
            )
