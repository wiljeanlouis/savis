"""Tests for Celery app configuration."""

# ruff: noqa: S101

from app.adapters.celery.celery_app import (
    CELERY_TASK_EXCHANGE_NAME,
    CELERY_TASK_QUEUE_ARGUMENTS,
    CELERY_TASK_QUEUE_NAME,
    CELERY_TASK_ROUTING_KEY,
    celery_app,
)


def test_celery_task_queue_is_durable_quorum_queue() -> None:
    """Keep Celery task declarations compatible with RabbitMQ 4 defaults."""
    task_queue = next(
        queue
        for queue in celery_app.conf.task_queues
        if queue.name == CELERY_TASK_QUEUE_NAME
    )

    assert celery_app.conf.task_default_queue == CELERY_TASK_QUEUE_NAME
    assert celery_app.conf.task_default_exchange == CELERY_TASK_EXCHANGE_NAME
    assert celery_app.conf.task_default_exchange_type == "topic"
    assert celery_app.conf.task_default_routing_key == CELERY_TASK_ROUTING_KEY
    assert celery_app.conf.task_default_delivery_mode == "persistent"
    assert celery_app.conf.broker_transport_options == {"confirm_publish": True}
    assert task_queue.name == CELERY_TASK_QUEUE_NAME
    assert task_queue.durable is True
    assert task_queue.queue_arguments == CELERY_TASK_QUEUE_ARGUMENTS
    assert task_queue.routing_key == CELERY_TASK_ROUTING_KEY
    assert task_queue.exchange.name == CELERY_TASK_EXCHANGE_NAME
    assert task_queue.exchange.type == "topic"
    assert task_queue.exchange.durable is True


def test_celery_worker_does_not_declare_transient_control_queue() -> None:
    """Avoid Celery pidbox queues rejected by recent RabbitMQ versions."""
    assert celery_app.conf.worker_enable_remote_control is False
    assert celery_app.conf.worker_cancel_long_running_tasks_on_connection_loss is True
