# SAVIS Executor

**SAVIS Executor** is the Python execution service of [SAVIS](../README.md). It collects provider offers asynchronously for component/search terms requested by the [SAVIS API](../savis-api/README.md).

## Responsibilities

- Receive offer collection requests from RabbitMQ and HTTP.
- Track executor tasks.
- Enqueue provider collection and refresh work into Celery.
- Schedule due-offer refresh and stale-task cleanup through Celery Beat.
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

## Task Scheduling

Celery Beat runs in its own `executor_beat` container and publishes periodic tasks to RabbitMQ:

- every hour, enqueue refresh tasks for `VALID` offers whose `next_refresh_at` is due;
- every 15 minutes, mark stale in-progress executor tasks as failed.

FastAPI does not run stale-task cleanup in a background thread anymore. The API process only starts the HTTP app and the lightweight RabbitMQ subscriber.

## Offer Request Deduplication

The Java API may emit a `ComponentNeededEvent` for every BOM component. The executor decides whether collection is needed.

For RabbitMQ offer requests, `SavisTaskUseCase` creates a `GET_OFFERS` task only when at least one configured provider does not already have offers for the incoming `search_term` and `type`. This means adding a new provider will cause old component terms to be scraped for that new provider, while already-known provider offers are reconciled by provider identifier and external id.

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
