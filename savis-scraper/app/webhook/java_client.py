import httpx
import logging
from fastapi.encoders import jsonable_encoder
from app.schemas.offer import Offer

JAVA_URL = "http://localhost:8080/api/v1/supply/offers"


async def send_results(task_id: int, offers: list[Offer]):
    payload = {"id": task_id, "offers": offers}
    async with httpx.AsyncClient() as client:
        try:
            json_payload = jsonable_encoder(payload)
            response = await client.post(JAVA_URL, json=json_payload)
            response.raise_for_status()
        except Exception as e:
            logging.error("Erreur lors du rappel vers Java: %s", e)
