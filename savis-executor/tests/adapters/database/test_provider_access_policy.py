"""Tests for the persistent provider access policy."""

# ruff: noqa: D103, S101

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.adapters.database.provider_access_policy import (
    ProviderAccessStateEntity,
    SqlAlchemyProviderAccessPolicy,
)
from app.adapters.database.session import Base
from app.core.ports import ProviderCircuitOpenError

PROVIDER_IDENTIFIER = "8772"
SECOND_BLOCK_COUNT = 2


class MutableClock:
    """Controllable UTC clock for policy tests."""

    def __init__(self, current: datetime) -> None:
        """Initialize the current time."""
        self.current = current

    def __call__(self) -> datetime:
        """Return the current test time."""
        return self.current


def _policy(
    clock: MutableClock,
    *,
    cooldown_seconds: tuple[int, ...] = (900, 3600),
) -> tuple[
    SqlAlchemyProviderAccessPolicy,
    sessionmaker[Session],
    list[float],
]:
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    sleeps: list[float] = []
    return (
        SqlAlchemyProviderAccessPolicy(
            session_factory=session_factory,
            min_delay_seconds=5,
            max_delay_seconds=5,
            cooldown_seconds=cooldown_seconds,
            probe_timeout_seconds=30,
            clock=clock,
            sleeper=sleeps.append,
            random_delay=lambda _minimum, _maximum: 5,
        ),
        session_factory,
        sleeps,
    )


def test_wait_for_request_spaces_provider_navigations() -> None:
    now = datetime(2026, 6, 13, 12, 0, tzinfo=UTC)
    clock = MutableClock(now)
    policy, session_factory, sleeps = _policy(clock)

    policy.wait_for_request(PROVIDER_IDENTIFIER)
    policy.wait_for_request(PROVIDER_IDENTIFIER)

    assert sleeps == [5.0]
    with session_factory() as session:
        state = session.get(ProviderAccessStateEntity, PROVIDER_IDENTIFIER)
    assert state is not None
    assert state.next_request_at == (now + timedelta(seconds=10)).replace(tzinfo=None)


def test_record_block_opens_circuit_with_progressive_cooldown() -> None:
    now = datetime(2026, 6, 13, 12, 0, tzinfo=UTC)
    clock = MutableClock(now)
    policy, session_factory, _sleeps = _policy(clock)

    policy.record_block(PROVIDER_IDENTIFIER)

    with pytest.raises(ProviderCircuitOpenError, match="suspended until"):
        policy.wait_for_request(PROVIDER_IDENTIFIER)

    clock.current = now + timedelta(seconds=901)
    policy.wait_for_request(PROVIDER_IDENTIFIER)
    policy.record_block(PROVIDER_IDENTIFIER)

    with session_factory() as session:
        state = session.get(ProviderAccessStateEntity, PROVIDER_IDENTIFIER)
    assert state is not None
    assert state.consecutive_blocks == SECOND_BLOCK_COUNT
    assert state.blocked_until == (
        clock.current + timedelta(seconds=3600)
    ).replace(tzinfo=None)


def test_expired_circuit_allows_only_one_recovery_probe() -> None:
    now = datetime(2026, 6, 13, 12, 0, tzinfo=UTC)
    clock = MutableClock(now)
    policy, _session_factory, _sleeps = _policy(clock)
    policy.record_block(PROVIDER_IDENTIFIER)
    clock.current = now + timedelta(seconds=901)

    policy.wait_for_request(PROVIDER_IDENTIFIER)

    with pytest.raises(ProviderCircuitOpenError, match="probe is already reserved"):
        policy.wait_for_request(PROVIDER_IDENTIFIER)


def test_record_success_closes_circuit_and_resets_failures() -> None:
    now = datetime(2026, 6, 13, 12, 0, tzinfo=UTC)
    clock = MutableClock(now)
    policy, session_factory, _sleeps = _policy(clock)
    policy.record_block(PROVIDER_IDENTIFIER)
    clock.current = now + timedelta(seconds=901)
    policy.wait_for_request(PROVIDER_IDENTIFIER)

    policy.record_success(PROVIDER_IDENTIFIER)
    policy.wait_for_request(PROVIDER_IDENTIFIER)

    with session_factory() as session:
        state = session.get(ProviderAccessStateEntity, PROVIDER_IDENTIFIER)
    assert state is not None
    assert state.consecutive_blocks == 0
    assert state.blocked_until is None
    assert state.probe_reserved_until is None
