"""Persistent provider pacing and circuit-breaker policy."""

from __future__ import annotations

import random
import time
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, Session, mapped_column, sessionmaker

from app.adapters.database.session import Base, SessionLocal
from app.config import EnvParams
from app.core.ports import ProviderAccessPolicy, ProviderCircuitOpenError

if TYPE_CHECKING:
    from collections.abc import Callable, Sequence


class ProviderAccessStateEntity(Base):
    """Database state for one provider access policy."""

    __tablename__ = "provider_access_states"

    provider_identifier: Mapped[str] = mapped_column(String(255), primary_key=True)
    consecutive_blocks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    blocked_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    probe_reserved_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_request_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    next_request_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_success_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_block_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


class SqlAlchemyProviderAccessPolicy(ProviderAccessPolicy):
    """Persist request spacing and provider circuit-breaker state."""

    def __init__(  # noqa: PLR0913
        self,
        session_factory: sessionmaker[Session] = SessionLocal,
        min_delay_seconds: float = EnvParams.PROVIDER_MIN_REQUEST_DELAY_SECONDS,
        max_delay_seconds: float = EnvParams.PROVIDER_MAX_REQUEST_DELAY_SECONDS,
        cooldown_seconds: Sequence[int] = EnvParams.PROVIDER_BLOCK_COOLDOWN_SECONDS,
        probe_timeout_seconds: int = EnvParams.PROVIDER_PROBE_TIMEOUT_SECONDS,
        clock: Callable[[], datetime] | None = None,
        sleeper: Callable[[float], None] = time.sleep,
        random_delay: Callable[[float, float], float] = random.uniform,
    ) -> None:
        """Initialize the persistent provider access policy."""
        if min_delay_seconds < 0 or max_delay_seconds < min_delay_seconds:
            msg = "Provider request delay range is invalid"
            raise ValueError(msg)
        if not cooldown_seconds or any(value <= 0 for value in cooldown_seconds):
            msg = "Provider block cooldowns must contain positive values"
            raise ValueError(msg)
        if probe_timeout_seconds <= 0:
            msg = "Provider probe timeout must be positive"
            raise ValueError(msg)

        self.session_factory = session_factory
        self.min_delay_seconds = min_delay_seconds
        self.max_delay_seconds = max_delay_seconds
        self.cooldown_seconds = tuple(cooldown_seconds)
        self.probe_timeout_seconds = probe_timeout_seconds
        self.clock = clock or (lambda: datetime.now(UTC))
        self.sleeper = sleeper
        self.random_delay = random_delay

    def wait_for_request(self, provider_identifier: str) -> None:
        """Reserve and wait for the next provider request slot."""
        now = self.clock()

        with self.session_factory() as session:
            state = self._locked_state(session, provider_identifier, now)
            blocked_until = _as_utc(state.blocked_until)
            if blocked_until is not None and blocked_until > now:
                msg = (
                    f"Provider {provider_identifier} access is suspended until "
                    f"{blocked_until.isoformat()}"
                )
                raise ProviderCircuitOpenError(msg)

            if blocked_until is not None:
                probe_reserved_until = _as_utc(state.probe_reserved_until)
                if probe_reserved_until is not None and probe_reserved_until > now:
                    msg = (
                        f"Provider {provider_identifier} recovery probe is already "
                        f"reserved until {probe_reserved_until.isoformat()}"
                    )
                    raise ProviderCircuitOpenError(msg)
                state.probe_reserved_until = now + timedelta(
                    seconds=self.probe_timeout_seconds,
                )

            next_request_at = _as_utc(state.next_request_at)
            request_at = max(now, next_request_at) if next_request_at else now
            delay_seconds = max(0.0, (request_at - now).total_seconds())
            spacing_seconds = self.random_delay(
                self.min_delay_seconds,
                self.max_delay_seconds,
            )
            state.last_request_at = request_at
            state.next_request_at = request_at + timedelta(seconds=spacing_seconds)
            state.updated_at = now
            session.commit()

        if delay_seconds > 0:
            self.sleeper(delay_seconds)

    def record_success(self, provider_identifier: str) -> None:
        """Close the provider circuit after a successful request."""
        now = self.clock()
        with self.session_factory() as session:
            state = self._locked_state(session, provider_identifier, now)
            state.consecutive_blocks = 0
            state.blocked_until = None
            state.probe_reserved_until = None
            state.last_success_at = now
            state.updated_at = now
            session.commit()

    def record_block(self, provider_identifier: str) -> None:
        """Open the provider circuit using progressive cooldowns."""
        now = self.clock()
        with self.session_factory() as session:
            state = self._locked_state(session, provider_identifier, now)
            state.consecutive_blocks += 1
            cooldown_index = min(
                state.consecutive_blocks - 1,
                len(self.cooldown_seconds) - 1,
            )
            state.blocked_until = now + timedelta(
                seconds=self.cooldown_seconds[cooldown_index],
            )
            state.probe_reserved_until = None
            state.last_block_at = now
            state.updated_at = now
            session.commit()

    @staticmethod
    def _locked_state(
        session: Session,
        provider_identifier: str,
        now: datetime,
    ) -> ProviderAccessStateEntity:
        state = session.get(
            ProviderAccessStateEntity,
            provider_identifier,
            with_for_update=True,
        )
        if state is None:
            state = ProviderAccessStateEntity(
                provider_identifier=provider_identifier,
                consecutive_blocks=0,
                updated_at=now,
            )
            session.add(state)
            session.flush()
        return state


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
