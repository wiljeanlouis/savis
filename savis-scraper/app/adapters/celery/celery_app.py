"""Celery app module."""

from app.config import env_params
from celery import Celery

celery_app = Celery(
    "savis",
    broker=env_params.RABBIT_MQ_URL,
    backend=env_params.REDIS_URL,
)

celery_app.conf.update(
    task_track_started=True,
    task_time_limit=1800,  # 30 min
    task_max_tasks_per_child=10,
    task_send_sent_event=True,
    worker_send_task_events=True,
    worker_prefetch_multiplier=1,
    timezone="Canada/Eastern",
    result_expires=86400,
)

celery_app.autodiscover_tasks(["app.adapters.celery"])
