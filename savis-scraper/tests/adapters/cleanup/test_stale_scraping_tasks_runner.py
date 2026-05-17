"""Tests for stale scraping task cleanup runner."""

# ruff: noqa: D101, D102, D103, S101

from app.adapters.cleanup import stale_scraping_tasks_runner

FAILED_COUNT = 2


class SuccessfulCleanupUseCase:
    def mark_stale_tasks_failed(self) -> int:
        return FAILED_COUNT


class FailingCleanupUseCase:
    def mark_stale_tasks_failed(self) -> int:
        msg = "database unavailable"
        raise RuntimeError(msg)


def test_run_once_returns_failed_count() -> None:
    failed_count = stale_scraping_tasks_runner.run_once(SuccessfulCleanupUseCase())

    assert failed_count == FAILED_COUNT


def test_run_once_logs_errors_without_crashing() -> None:
    failed_count = stale_scraping_tasks_runner.run_once(FailingCleanupUseCase())

    assert failed_count == 0
