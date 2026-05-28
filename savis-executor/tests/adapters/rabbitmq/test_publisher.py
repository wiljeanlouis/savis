"""Tests for the RabbitMQ result publisher."""

# ruff: noqa: D101, D102, D103, D105, D107, S101

import json
from typing import TYPE_CHECKING, Self

from app.adapters.rabbitmq import publisher
from app.core.models import Offer, Price, Provider

if TYPE_CHECKING:
    import pytest


class FakeChannel:
    def __init__(self) -> None:
        self.declarations: list[dict[str, object]] = []
        self.published: list[dict[str, object]] = []

    def queue_declare(self, **kwargs: object) -> None:
        self.declarations.append(kwargs)

    def basic_publish(self, **kwargs: object) -> None:
        self.published.append(kwargs)


class FakeConnection:
    def __init__(self, _params: object) -> None:
        self.channel_instance = FakeChannel()

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def channel(self) -> FakeChannel:
        return self.channel_instance


def test_publish_success_sends_payload_to_offer_results_queue(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connections: list[FakeConnection] = []

    def build_connection(params: object) -> FakeConnection:
        connection = FakeConnection(params)
        connections.append(connection)
        return connection

    monkeypatch.setattr(publisher, "BlockingConnection", build_connection)
    monkeypatch.setattr(publisher, "URLParameters", lambda url: url)
    monkeypatch.setattr(
        publisher,
        "BasicProperties",
        lambda **kwargs: kwargs,
    )

    publisher.RabbitMqResultPublisher().publish_success(
        {"id": "task-id", "offers": [{"label": "Flour"}]},
    )

    channel = connections[0].channel_instance
    assert channel.declarations == [
        {
            "queue": "savis.offer.results",
            "durable": True,
            "arguments": {"x-queue-type": "classic"},
        },
    ]
    assert channel.published == [
        {
            "exchange": "",
            "routing_key": "savis.offer.results",
            "body": json.dumps({"id": "task-id", "offers": [{"label": "Flour"}]}),
            "properties": {"delivery_mode": 2, "content_type": "application/json"},
        },
    ]


def test_publish_offer_invalidation_sends_payload_to_invalidations_queue(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    connections: list[FakeConnection] = []

    def build_connection(params: object) -> FakeConnection:
        connection = FakeConnection(params)
        connections.append(connection)
        return connection

    monkeypatch.setattr(publisher, "BlockingConnection", build_connection)
    monkeypatch.setattr(publisher, "URLParameters", lambda url: url)
    monkeypatch.setattr(
        publisher,
        "BasicProperties",
        lambda **kwargs: kwargs,
    )

    offer = Offer(
        id=None,
        external_id="external-id",
        url="https://example.com",
        brand="Example",
        label="Flour",
        price=Price("4.99"),
        package_size=None,
        image_url="https://example.com/image.png",
        provider=Provider("Example", "example", "https://example.com", "123 Street"),
    )

    publisher.RabbitMqResultPublisher().publish_offer_invalidation(offer)

    channel = connections[0].channel_instance
    assert channel.declarations[0]["queue"] == "savis.offer.invalidations"
    assert channel.published[0]["routing_key"] == "savis.offer.invalidations"
    assert json.loads(channel.published[0]["body"]) == {
        "id": None,
        "external_id": "external-id",
        "provider_identifier": "example",
    }
