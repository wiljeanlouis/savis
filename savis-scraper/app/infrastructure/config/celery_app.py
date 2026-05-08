"""Celery application configuration for the Savis scraper."""

from celery import Celery

from app.infrastructure.config.settings import settings

celery = Celery(
    "savis",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.conf.update(
    task_track_started=True,
    task_time_limit=1800,  # 30 min
)

celery.conf.timezone = "Canada/Eastern"  # pyright: ignore[reportAttributeAccessIssue]

celery.autodiscover_tasks(["app.infrastructure.entrypoints.worker.tasks"])

celery.conf.update(worker_send_task_events=True, task_send_sent_event=True)
