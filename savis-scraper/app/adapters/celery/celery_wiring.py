"""Dependency wiring for Celery tasks."""

from typing import TYPE_CHECKING

from app.container import Container

if TYPE_CHECKING:
    from app.core.use_case_savis_tasks import SavisTaskUseCase


def get_savis_task_use_case() -> SavisTaskUseCase:
    """Resolve the task use case for Celery tasks."""
    return Container.savis_task_use_case()
