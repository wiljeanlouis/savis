"""Behavior checks for local worker readiness."""

# ruff: noqa: D103, S101

import os
import time
from typing import TYPE_CHECKING
from unittest.mock import Mock

import pytest

from app.adapters.celery import worker_health
from app.adapters.celery.celery_app import celery_app
from app.adapters.celery.worker_health import WorkerHeartbeat

if TYPE_CHECKING:
    from pathlib import Path


@pytest.fixture
def heartbeat_path(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    path = tmp_path / "heartbeat"
    monkeypatch.setattr(worker_health, "HEARTBEAT_PATH", path)
    return path


def test_missing_heartbeat_is_unhealthy(heartbeat_path: Path) -> None:
    assert not heartbeat_path.exists()
    assert not worker_health.heartbeat_is_fresh()


@pytest.mark.parametrize("age", [0, 89, 91, -10])
def test_freshness(heartbeat_path: Path, age: int) -> None:
    heartbeat_path.touch()
    timestamp = time.time() - age
    os.utime(heartbeat_path, (timestamp, timestamp))
    assert worker_health.heartbeat_is_fresh() == (
        0 <= age <= worker_health.HEARTBEAT_MAX_AGE_SECONDS
    )


def test_consumer_lifecycle_invalidates_and_restores_readiness(
    heartbeat_path: Path,
) -> None:
    consumer = Mock()
    heartbeat_path.touch()
    step = WorkerHeartbeat(consumer)
    assert not heartbeat_path.exists()
    assert WorkerHeartbeat in celery_app.steps["consumer"]

    # A previous process's fresh file must not make startup healthy.
    heartbeat_path.touch()
    step.start(consumer)
    assert not worker_health.heartbeat_is_fresh()
    interval, tick = consumer.hub.timer.call_repeatedly.call_args.args
    assert interval == worker_health.HEARTBEAT_INTERVAL_SECONDS

    # Only a callback from the consumer loop makes the worker ready.
    tick()
    assert worker_health.heartbeat_is_fresh()
    timer = step.timer
    step.stop(consumer)
    timer.cancel.assert_called_once()
    assert not worker_health.heartbeat_is_fresh()

    # Reconnection waits for loop progress again; shutdown is idempotent.
    step.start(consumer)
    assert not worker_health.heartbeat_is_fresh()
    consumer.hub.timer.call_repeatedly.call_args.args[1]()
    assert worker_health.heartbeat_is_fresh()
    step.shutdown(consumer)
    step.shutdown(consumer)
    assert not heartbeat_path.exists()
