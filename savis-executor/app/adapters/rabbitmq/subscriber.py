"""RabbitMQ subscriber module."""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from typing import TYPE_CHECKING

from pika import BasicProperties, BlockingConnection, URLParameters

from app.config import EnvParams
from app.container import Container
from app.core.models import SavisTaskType

if TYPE_CHECKING:
    from collections.abc import Callable

    from pika.adapters.blocking_connection import BlockingChannel
    from pika.spec import Basic

    from app.core.use_case_savis_tasks import SavisTaskUseCase

logger = logging.getLogger(__name__)

QUEUE_NAME = "savis.offer.requests"
RECONNECT_DELAY_SECONDS = 5


@dataclass
class MessageBody:
    """Message received from the offer request queue."""

    content: str


def _build_callback(
    use_case: SavisTaskUseCase,
) -> Callable[[BlockingChannel, Basic.Deliver, BasicProperties, bytes], None]:
    def callback(
        ch: BlockingChannel,
        method: Basic.Deliver,
        _properties: BasicProperties,
        body: bytes,
    ) -> None:
        try:
            data = json.loads(body)
            message = MessageBody(content=data["content"])
            use_case.enqueue_savis_task(
                SavisTaskType.GET_OFFERS,
                {"search_term": message.content},
            )
        except Exception:
            logger.exception("Failed to enqueue scraping task")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return

        ch.basic_ack(delivery_tag=method.delivery_tag)

    return callback


def _configure_channel(
    channel: BlockingChannel,
    callback: Callable[[BlockingChannel, Basic.Deliver, BasicProperties, bytes], None],
) -> None:
    channel.basic_qos(prefetch_count=1)
    channel.queue_declare(
        queue=QUEUE_NAME,
        durable=True,
        arguments={"x-queue-type": "classic"},
    )
    channel.basic_consume(
        queue=QUEUE_NAME,
        on_message_callback=callback,
        auto_ack=False,
    )


def _close_channel(channel: BlockingChannel | None) -> None:
    try:
        if channel is not None and channel.is_open:
            channel.close()
    except Exception:
        logger.exception("Failed to close RabbitMQ channel")


def _close_connection(connection: BlockingConnection | None) -> None:
    try:
        if connection is not None and connection.is_open:
            connection.close()
    except Exception:
        logger.exception("Failed to close RabbitMQ connection")


def subscribe() -> None:
    """Subscribe to offer request messages and enqueue scraping tasks."""
    connection = None
    channel = None
    try:
        params = URLParameters(EnvParams.RABBIT_MQ_URL)
        use_case = Container.savis_task_use_case()
        callback = _build_callback(use_case)

        connection = BlockingConnection(params)
        channel = connection.channel()
        _configure_channel(channel, callback)
        channel.start_consuming()
    finally:
        _close_channel(channel)
        _close_connection(connection)


def run_forever() -> None:
    """Run the RabbitMQ subscriber and reconnect after failures."""
    while True:
        try:
            subscribe()
        except Exception:
            logger.exception(
                "RabbitMQ subscriber stopped unexpectedly. Restarting in %s seconds.",
                RECONNECT_DELAY_SECONDS,
            )
            time.sleep(RECONNECT_DELAY_SECONDS)
