"""Background runner for stale executor task cleanup."""

import logging
import time
from typing import TYPE_CHECKING

from app.container import Container

if TYPE_CHECKING:
    from app.core.use_case_savis_tasks import SavisTaskUseCase

logger = logging.getLogger(__name__)

CLEANUP_INTERVAL_SECONDS = 15 * 60


def run_once(use_case: SavisTaskUseCase | None = None) -> int:
    """Run one stale task cleanup iteration."""
    cleanup_use_case = use_case or Container.savis_task_use_case()
    try:
        failed_count = cleanup_use_case.mark_stale_tasks_failed()
    except Exception:
        logger.exception("Failed to cleanup stale tasks")
        return 0

    if failed_count:
        logger.info("Marked %s stale tasks as failed", failed_count)
    return failed_count


def run_forever(interval_seconds: int = CLEANUP_INTERVAL_SECONDS) -> None:
    """Run stale task cleanup periodically."""
    logger.info(
        "Register stale task cleanup every %s min.",
        CLEANUP_INTERVAL_SECONDS / 60,
    )
    while True:
        run_once()
        time.sleep(interval_seconds)
