"""Celery app module."""

from datetime import timedelta

from celery import Celery

from app.config import EnvParams

env_params = EnvParams()

celery_app = Celery(
    "savis",
    broker=env_params.RABBIT_MQ_URL,
    include=["app.adapters.celery.celery_tasks"],
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
    task_send_sent_event=True,
    worker_send_task_events=True,
    worker_prefetch_multiplier=1,
)
