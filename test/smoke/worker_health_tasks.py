"""Tasks loaded only by the isolated worker health smoke stack."""

import time
from pathlib import Path

from celery import shared_task


@shared_task(name="smoke.long_running_health_check")
def long_running_health_check() -> None:
    """Keep the prefork child busy across several parent heartbeat ticks."""
    Path("/tmp/smoke-task-started").touch()
    time.sleep(25)
    Path("/tmp/smoke-task-finished").touch()
