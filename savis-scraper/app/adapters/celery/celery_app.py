"""Celery app module."""

from celery import Celery

from app.config import EnvParams

env_params = EnvParams()

celery_app = Celery(
    "savis",
    broker=env_params.RABBIT_MQ_URL,
    include=["app.adapters.celery.celery_tasks"],
)

celery_app.conf.update(
    task_track_started=True,
    task_time_limit=1800,  # 30 min
    task_max_tasks_per_child=10,
    task_send_sent_event=True,
    worker_send_task_events=True,
    worker_prefetch_multiplier=1,
    timezone="Canada/Eastern",
)
