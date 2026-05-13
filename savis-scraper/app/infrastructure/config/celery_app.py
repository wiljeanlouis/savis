"""Celery application configuration for the Savis scraper."""

from celery import Celery

from app.infrastructure.config.env_params import env_params

celery = Celery(
    "savis",
    broker=env_params.REDIS_URL,
    backend=env_params.REDIS_URL,
)

celery.conf.update(
    task_track_started=True,
    task_time_limit=1800,  # 30 min
    timezone="Canada/Eastern",
    worker_send_task_events=True,
    task_send_sent_event=True,
)

celery.autodiscover_tasks(["app.infrastructure.entrypoints.worker.tasks"])
