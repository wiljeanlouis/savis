"""Local readiness heartbeat driven by the AMQP consumer event loop."""

import sys
import time
from pathlib import Path
from typing import TYPE_CHECKING

from celery import bootsteps

if TYPE_CHECKING:
    from celery.worker.consumer.consumer import Consumer

# One worker per container; this file is private to its container filesystem.
HEARTBEAT_PATH = Path("/tmp/savis-worker-heartbeat")  # noqa: S108
HEARTBEAT_INTERVAL_SECONDS = 10
HEARTBEAT_MAX_AGE_SECONDS = 90


def heartbeat_is_fresh() -> bool:
    """Fail closed for missing, unreadable, stale, or future timestamps."""
    try:
        age = time.time() - HEARTBEAT_PATH.stat().st_mtime
    except OSError:
        return False
    return 0 <= age <= HEARTBEAT_MAX_AGE_SECONDS


class WorkerHeartbeat(bootsteps.StartStopStep):
    """Register the heartbeat only after task consumer setup succeeds."""

    requires = ("celery.worker.consumer.tasks:Tasks",)

    def __init__(self, consumer: Consumer, **kwargs: object) -> None:
        """Discard a previous process's heartbeat before connecting."""
        super().__init__(consumer, **kwargs)
        self.timer = None
        HEARTBEAT_PATH.unlink(missing_ok=True)

    def start(self, consumer: Consumer) -> None:
        """Schedule on the main event loop, never on an independent thread."""
        HEARTBEAT_PATH.unlink(missing_ok=True)
        self.timer = consumer.hub.timer.call_repeatedly(
            HEARTBEAT_INTERVAL_SECONDS, HEARTBEAT_PATH.touch,
        )

    def stop(self, _consumer: Consumer) -> None:
        """Invalidate readiness on shutdown and before broker reconnection."""
        if self.timer is not None:
            self.timer.cancel()
            self.timer = None
        HEARTBEAT_PATH.unlink(missing_ok=True)

    shutdown = stop


if __name__ == "__main__":
    if not heartbeat_is_fresh():
        sys.exit("Worker heartbeat missing or older than 90 seconds")
