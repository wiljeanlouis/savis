# SAVIS Executor

**SAVIS Executor** is the Python service responsible for asynchronous offer
acquisition in [SAVIS](../README.md). It searches provider websites, persists
the retrieved offers and their review lifecycle, refreshes known offers, and
publishes validated changes to SAVIS API.

The executor owns acquisition mechanics. It does not own BOMs, BOM components,
catalog products, or product cost calculation.

## Responsibilities

- Receive offer collection requests through RabbitMQ or HTTP.
- Persist and expose executor tasks.
- Queue collection and refresh work with Celery.
- Scrape provider websites through pluggable provider adapters.
- Normalize and reconcile provider results into executor offers.
- Support human review with `NEW`, `VALID`, and `REJECTED` statuses.
- Schedule refreshes for due valid offers.
- Publish valid offers and invalidations to SAVIS API through RabbitMQ.
- Mark tasks as completed, failed, or stale.

## Runtime Processes

The service is deployed as three processes that share PostgreSQL and RabbitMQ:

```text
SAVIS API                           SAVIS Admin
    |                                   |
    | savis.offer.requests              | HTTP
    v                                   v
+-------------------+             +-------------------+
| Executor API      |             | Executor API      |
| FastAPI           |<------------| :8000             |
| Rabbit subscriber |             +---------+---------+
+---------+---------+                       |
          | Celery tasks                    |
          v                                 |
+-------------------+                       |
| Executor Worker   |-----------------------+
| Celery + Chromium |
+---------+---------+
          |
          v
 Provider websites

+-------------------+
| Executor Beat     |
| periodic jobs     |
+-------------------+

Executor -> PostgreSQL: tasks and offers
Executor -> SAVIS API: offer results and invalidations through RabbitMQ
```

| Process | Role |
| --- | --- |
| `executor_api` | Serves FastAPI, creates the database schema, and runs the RabbitMQ request subscriber. |
| `executor_worker` | Executes Celery collection and refresh tasks with Playwright Chromium. |
| `executor_beat` | Schedules due-offer refreshes and stale-task cleanup. |

## Architecture

The code follows a ports-and-adapters organization:

```text
app/
├── core/
│   ├── models.py                  # Tasks, offers, statuses, and value objects
│   ├── ports.py                   # Repository, queue, provider, and publisher ports
│   ├── use_case_offers.py         # Offer collection and review lifecycle
│   └── use_case_savis_tasks.py    # Task creation and execution lifecycle
├── adapters/
│   ├── api/                       # FastAPI routes and Pydantic schemas
│   ├── celery/                    # Queue adapter, worker tasks, and Beat schedule
│   ├── database/                  # SQLAlchemy repositories
│   ├── rabbitmq/                  # SAVIS request subscriber and result publisher
│   └── scrapers/                  # Provider adapters and extraction logic
├── config.py                      # Environment configuration
├── container.py                   # Dependency composition
└── main.py                        # FastAPI application and lifespan
```

See [the system architecture](../docs/ARCHITECTURE.md) for the relationships
between SAVIS Admin, SAVIS API, SAVIS Executor, RabbitMQ, PostgreSQL, and
Supabase.

## Domain Model

### Tasks

Supported task types:

- `GET_OFFERS`: collect offers for a search term and offer type.
- `REFRESH_OFFER`: refresh one known offer from its provider URL.

Task statuses:

- `IN_PROGRESS`
- `COMPLETED`
- `FAILED`

Tasks retain their complete payload, timestamps, and final error message.

### Offers

An offer contains the provider identity, external product identity, URL, label,
brand, image, price, package size, search term, review status, refresh
configuration, and last task that observed it.

Supported offer types:

- `FOOD`
- `DECORATION`

Review statuses:

- `NEW`: retrieved and waiting for review.
- `VALID`: accepted and eligible for publication and scheduled refresh.
- `REJECTED`: rejected by an operator.

Provider results are reconciled by `(provider_identifier, external_id)`.

## Business Flows

### Collect Offers

1. SAVIS API publishes a component request to `savis.offer.requests`, or SAVIS
   Admin creates a `GET_OFFERS` task through HTTP.
2. The executor checks whether every configured provider already has offers for
   the requested search term and type.
3. If acquisition is required, it persists an `IN_PROGRESS` task before
   enqueueing Celery work.
4. The worker calls every configured provider adapter.
5. Retrieved offers are normalized, reconciled, and persisted with status
   `NEW`.
6. The task becomes `COMPLETED`; exhausted retries mark it `FAILED`.

A failure from one provider does not discard successful results from another.
Collection fails only when all configured providers fail.

### Review and Publish an Offer

1. SAVIS Admin lists and reviews executor offers.
2. Changing an offer from a non-valid status to `VALID` publishes it to
   `savis.offer.results`.
3. Changing a valid offer to `REJECTED` publishes an invalidation.
4. Deleting a valid offer publishes an invalidation before deleting it.

The Java API remains responsible for storing the offer projection consumed by
the BOM module.

### Refresh Offers

Celery Beat runs every hour and creates `REFRESH_OFFER` tasks for `VALID`
offers whose `next_refresh_at` is due. A changed valid offer is published again
after refresh. Each offer has a configurable refresh frequency, with a default
of 24 hours.

### Recover Stale Tasks

Every 15 minutes, Celery Beat marks `IN_PROGRESS` tasks older than two hours as
`FAILED`. Collection and refresh tasks retry failures with backoff up to three
times and have a 30-minute execution limit.

## HTTP API

FastAPI exposes interactive OpenAPI documentation at
`http://localhost:8000/docs`.

### Tasks

`POST /tasks` creates a task. It returns `409 Conflict` when all configured
providers already have offers for a `GET_OFFERS` request.

Collect food offers:

```json
{
  "type": "GET_OFFERS",
  "payload": {
    "search_term": "farine",
    "type": "FOOD"
  }
}
```

Refresh one offer:

```json
{
  "type": "REFRESH_OFFER",
  "payload": {
    "offer_id": "01975c75-9eb3-7000-8000-000000000001",
    "url": "https://www.maxi.ca/example-offer/p/12345"
  }
}
```

`GET /tasks` supports:

- pagination: `page`, `size`;
- filters: `status`, `type`;
- sorting: `sort_by`, `sort_direction`.

Task sort fields are `type`, `status`, `created_at`, `updated_at`, and
`completed_at`.

### Offers

`GET /offers` supports:

- pagination: `page`, `size`;
- filters: `status`, `type`, `search_term`;
- sorting: `sort_by`, `sort_direction`.

Offer sort fields are `label`, `brand`, `price`, `package_size`, `provider`,
`search_term`, `status`, `last_retrieved_at`, and `next_refresh_at`.

Additional endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/offers/facets/search-terms` | Count offers by search term, optionally filtered by status and type. |
| `PATCH` | `/offers/{offer_id}` | Change status and/or `refresh_frequency_hours`. |
| `DELETE` | `/offers/{offer_id}` | Delete an offer and invalidate it first when currently valid. |

## RabbitMQ Contracts

All queues are durable classic queues. Published result and invalidation
messages use persistent delivery.

### Incoming Requests

Queue: `savis.offer.requests`

```json
{
  "content": "farine",
  "type": "FOOD"
}
```

`type` defaults to `FOOD` when omitted. The subscriber uses manual
acknowledgements, a prefetch count of one, and reconnects after connection
failures.

### Offer Results

Queue: `savis.offer.results`

Results are published when an offer becomes valid or when a refresh changes a
valid offer:

```json
{
  "id": "01975c75-9eb3-7000-8000-000000000001",
  "offers": [
    {
      "external_id": "provider-product-id",
      "label": "Example product",
      "provider": {
        "identifier": "8772"
      },
      "price": {
        "amount": "4.99",
        "currency": "CAD"
      },
      "package_size": {
        "value": 1,
        "unit": "kg"
      }
    }
  ]
}
```

The actual offer payload also includes its URL, brand, image, search term,
review and refresh metadata.

### Offer Invalidations

Queue: `savis.offer.invalidations`

```json
{
  "id": "01975c75-9eb3-7000-8000-000000000001",
  "external_id": "provider-product-id",
  "provider_identifier": "8772"
}
```

## Provider Adapters

The provider registry currently loads one adapter:

- **Maxi**, store `8772` in Drummondville, using Playwright and
  BeautifulSoup-based extraction.

The worker blocks image, media, and font requests while scraping. New providers
must implement the `OfferProvider` port and be registered by
`load_offer_providers()`.

Package quantities are normalized to the symbols consumed by SAVIS API,
including `g`, `kg`, `l`, `ml`, and `piece`.

## Persistence

The executor owns two SQLAlchemy tables:

- `savis_tasks`: task type, payload, status, timestamps, and error.
- `offers`: provider product data, price, package size, review status, offer
  type, and refresh metadata.

PostgreSQL uses the `savis_executor` schema by default. At FastAPI startup, the
executor creates the schema when needed and calls `Base.metadata.create_all()`.
The module does not currently use a migration framework.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@postgres:5432/postgres` | SQLAlchemy connection URL. |
| `DATABASE_SCHEMA` | `savis_executor` | PostgreSQL schema owned by the executor. |
| `RABBIT_MQ_URL` | Development placeholder | RabbitMQ URL used by the subscriber, publisher, and Celery. |
| `REDIS_URL` | Development placeholder | Present in configuration, but not used by the active runtime paths. |

The root Docker Compose file provides concrete values from the repository
environment.

## Local Development

Requirements:

- Python 3.14.4 or newer;
- [uv](https://docs.astral.sh/uv/);
- PostgreSQL;
- RabbitMQ;
- Chromium installed through Playwright.

Install dependencies and the browser:

```bash
uv sync
uv run playwright install chromium
```

Start each process in a separate terminal:

```bash
uv run fastapi dev
```

```bash
uv run celery -A app.adapters.celery.celery_app worker --loglevel=info
```

```bash
uv run celery -A app.adapters.celery.celery_app beat --loglevel=info
```

The API listens on `http://localhost:8000`.

To run the complete SAVIS environment from the repository root:

```bash
docker compose up --build
```

The Dockerfile provides dedicated `api`, `worker`, and `beat` targets. The
worker image includes Playwright Chromium and runs with a concurrency of two.

## Tests and Quality

The test suite covers core use cases, API routes, SQLAlchemy repositories,
RabbitMQ adapters, Celery tasks, and Maxi extraction.

```bash
uv run pytest
uv run ruff check .
```

For a lightweight syntax check:

```bash
uv run python -m compileall -q app
```
