from typing import Literal

import httpx

from app.infrastructure.config.settings import settings

RETRY_MAX_ATTEMPT: Literal[3] = 3

http_client = httpx.Client(
    base_url=settings.JAVA_API_URL,
    timeout=30,
)
