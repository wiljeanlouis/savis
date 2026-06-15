"""Liveness and readiness endpoints."""

import logging

from fastapi import APIRouter, HTTPException, status
from pika import BlockingConnection, URLParameters
from sqlalchemy import text

from app.adapters.database.session import engine
from app.config import EnvParams

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)


def check_database() -> None:
    """Raise when PostgreSQL cannot answer a trivial query."""
    with engine.connect() as connection:
        connection.execute(text("select 1"))


def check_rabbitmq() -> None:
    """Raise when RabbitMQ cannot accept a connection."""
    parameters = URLParameters(EnvParams.RABBIT_MQ_URL)
    parameters.socket_timeout = 3
    parameters.blocked_connection_timeout = 3
    with BlockingConnection(parameters):
        pass


@router.get("/health/live")
def liveness() -> dict[str, str]:
    """Report that the HTTP process is alive."""
    return {"status": "UP"}


@router.get("/health")
def readiness() -> dict[str, str]:
    """Report readiness only when required infrastructure is available."""
    try:
        check_database()
        check_rabbitmq()
    except Exception as exc:
        logger.exception("Executor readiness check failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="A required dependency is unavailable",
        ) from exc
    return {"status": "UP"}
