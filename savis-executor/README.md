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

## HTTP API Used by SAVIS Admin

The BOM component feature in `savis-admin` calls the executor directly:

- `GET /offers`: list offers with pagination, sorting, status, type, and search-term filters;
- `GET /offers/facets/search-terms`: list search-term facets;
- `PATCH /offers/{offerId}`: change review status or refresh frequency;
- `DELETE /offers/{offerId}`: delete an offer;
- `POST /tasks`: enqueue `GET_OFFERS` or `REFRESH_OFFER`;
- `GET /tasks`: inspect paginated executor tasks and their complete payload/error details.

In the admin code, task screens live below the `bom-component` feature because
tasks are an acquisition detail rather than a top-level user-facing business
feature. The executor domain remains the owner of task creation, execution,
status, and persistence.

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
