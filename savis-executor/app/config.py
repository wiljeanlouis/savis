"""Config module."""

import logging
import os


def _int_tuple_from_env(name: str, default: str) -> tuple[int, ...]:
    return tuple(
        int(value.strip())
        for value in os.getenv(name, default).split(",")
        if value.strip()
    )


def setup_logging() -> None:
    """Configure the root logger for the application."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


class EnvParams:
    """Configuration settings for the Savis executor application."""

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/postgres",
    )
    DATABASE_SCHEMA = os.getenv("DATABASE_SCHEMA", "savis_executor")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    RABBIT_MQ_URL = os.getenv(
        "RABBIT_MQ_URL",
        "amqp://guest:guest@localhost:5672/%2f",
    )
    BROWSER_CDP_URL = os.getenv(
        "BROWSER_CDP_URL",
        "http://localhost:9222",
    )
    PROVIDER_MIN_REQUEST_DELAY_SECONDS = float(
        os.getenv("PROVIDER_MIN_REQUEST_DELAY_SECONDS", "60"),
    )
    PROVIDER_MAX_REQUEST_DELAY_SECONDS = float(
        os.getenv("PROVIDER_MAX_REQUEST_DELAY_SECONDS", "600"),
    )
    PROVIDER_BLOCK_COOLDOWN_SECONDS = _int_tuple_from_env(
        "PROVIDER_BLOCK_COOLDOWN_SECONDS",
        "900,3600,21600,86400",
    )
    PROVIDER_PROBE_TIMEOUT_SECONDS = int(
        os.getenv("PROVIDER_PROBE_TIMEOUT_SECONDS", "1800"),
    )


setup_logging()
