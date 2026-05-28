"""Tests for the RabbitMQ offer request subscriber."""

# ruff: noqa: D101, D102, D103, D107, FBT001, S101

import json

from app.adapters.rabbitmq.subscriber import _build_callback
from app.core.models import SavisTaskType


class FakeChannel:
    def __init__(self) -> None:
        self.acks: list[int] = []
        self.nacks: list[tuple[int, bool]] = []

    def basic_ack(self, delivery_tag: int) -> None:
        self.acks.append(delivery_tag)

    def basic_nack(self, delivery_tag: int, requeue: bool) -> None:
        self.nacks.append((delivery_tag, requeue))


class FakeMethod:
    delivery_tag = 123


class FakeSavisTaskUseCase:
    def __init__(self) -> None:
        self.calls: list[tuple[SavisTaskType, dict[str, str]]] = []

    def enqueue_savis_task(
        self,
        task_type: SavisTaskType,
        payload: dict[str, str],
    ) -> None:
        self.calls.append((task_type, payload))


def test_subscriber_delegates_offer_request_to_skip_aware_use_case() -> None:
    channel = FakeChannel()
    use_case = FakeSavisTaskUseCase()
    callback = _build_callback(use_case)

    callback(
        channel,
        FakeMethod(),
        object(),
        json.dumps({"content": "flour", "type": "FOOD"}).encode(),
    )

    assert use_case.calls == [
        (
            SavisTaskType.GET_OFFERS,
            {"search_term": "flour", "offer_type": "FOOD"},
        ),
    ]
    assert channel.acks == [FakeMethod.delivery_tag]
    assert channel.nacks == []
