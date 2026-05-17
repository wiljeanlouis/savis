"""Config module."""

import logging
import os


def setup_logging() -> None:
    """Configure the root logger for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


class EnvParams:
    """Configuration settings for the Savis scraper application."""

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@postgres:5432/postgres",
    )
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:xxxx/x")
    RABBIT_MQ_URL = os.getenv("RABBIT_MQ_URL", "amqp://xxxx:xxxx@rabbitmq:xxxx//")


setup_logging()
