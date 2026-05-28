# SAVIS Executor

**SAVIS Executor** is the Python execution service of [SAVIS](../README.md). It collects provider offers asynchronously for component/search terms requested by the [SAVIS API](../savis-api/README.md).

## Responsibilities

- Receive offer collection requests from RabbitMQ and HTTP.
- Track executor tasks.
- Enqueue provider collection and refresh work into Celery.
- Run provider scraper adapters.
- Normalize provider results into core `Offer` models.
- Publish successful offer results and invalidations back to the Java API through RabbitMQ.

## Messaging Contract

Input queue:

- `savis.offer.requests`: component/search terms requested by the Java BOM slice.

Output queues:

- `savis.offer.results`: collected provider offers.
- `savis.offer.invalidations`: offer invalidation messages.

Offer result messages include product identity, provider data, price, package size, image URL, and product URL. The Java API stores those offers and exposes available offers back to the admin UI for BOM component selection.

## Unit Symbols

The executor emits package units using the same symbols consumed by Java:

- `g`
- `kg`
- `l`
- `ml`
- `piece`
- `portion`

Java keeps enum constants internally, but API payloads and persisted unit values use symbols.

## Development

```bash
uv run fastapi dev
uv run celery -A app.adapters.celery.celery_app worker --loglevel=info
uv run celery -A app.adapters.celery.celery_app beat --loglevel=info
uv run ruff check .
```

If using the checked-in virtual environment locally:

```bash
./.venv/bin/python -m compileall -q app
./.venv/bin/ruff check app
```
