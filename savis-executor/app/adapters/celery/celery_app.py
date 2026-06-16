"""Celery app module."""

from datetime import timedelta

from celery import Celery
from kombu import Exchange, Queue

from app.config import EnvParams

env_params = EnvParams()

CELERY_TASK_QUEUE_NAME = "savis.executor.tasks"
CELERY_TASK_EXCHANGE_NAME = "savis.executor.tasks"
CELERY_TASK_ROUTING_KEY = "savis.executor.tasks"
CELERY_TASK_QUEUE_ARGUMENTS = {"x-queue-type": "quorum"}

celery_app = Celery(
    "savis",
    broker=env_params.RABBIT_MQ_URL,
    include=["app.adapters.celery.celery_tasks"],
)

task_exchange = Exchange(
    CELERY_TASK_EXCHANGE_NAME,
    type="topic",
    durable=True,
)

celery_app.conf.update(
    beat_schedule={
        "schedule-due-offer-refresh-tasks-every-1h": {
            "task": (
                "app.adapters.celery.celery_tasks.schedule_due_offer_refresh_tasks"
            ),
            "schedule": timedelta(hours=1),
        },
        "cleanup-stale-savis-tasks-every-15m": {
            "task": "app.adapters.celery.celery_tasks.cleanup_stale_savis_tasks",
            "schedule": timedelta(minutes=15),
        },
    },
    timezone="UTC",
    task_track_started=True,
    task_time_limit=1800,  # 30 min
    task_max_tasks_per_child=10,
    task_default_queue=CELERY_TASK_QUEUE_NAME,
    task_default_exchange=CELERY_TASK_EXCHANGE_NAME,
    task_default_exchange_type="topic",
    task_default_routing_key=CELERY_TASK_ROUTING_KEY,
    task_default_delivery_mode="persistent",
    broker_transport_options={"confirm_publish": True},
    task_queues=(
        Queue(
            CELERY_TASK_QUEUE_NAME,
            task_exchange,
            routing_key=CELERY_TASK_ROUTING_KEY,
            durable=True,
            queue_arguments=CELERY_TASK_QUEUE_ARGUMENTS,
        ),
    ),
    task_send_sent_event=True,
    worker_cancel_long_running_tasks_on_connection_loss=True,
    worker_enable_remote_control=False,
    worker_send_task_events=True,
    worker_prefetch_multiplier=1,
)
