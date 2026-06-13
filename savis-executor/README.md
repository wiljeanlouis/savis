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
| Celery, one process |
+---------+---------+
          | Playwright over CDP
          v
+-------------------+
| Host Google Chrome |
| persistent profile |
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
| `executor_worker` | Executes Celery collection and refresh tasks through an external Google Chrome CDP session. |
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
│   └── scrapers/
│       ├── browser_manager.py     # External Chrome CDP connection lifecycle
│       └── maxi/
│           ├── scraper.py         # Navigation, block detection, provider adapter
│           ├── list_extractor.py  # Search-result extraction
│           ├── details_extractor.py # Product-detail extraction
│           ├── parsing.py         # Shared provider parsing and normalization
│           └── models.py          # Provider draft conversion
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

- `GET_OFFER`: collect one known offer from a selected provider URL.
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
- `MATERIAL`

Review statuses:

- `NEW`: retrieved and waiting for review.
- `VALID`: accepted and eligible for publication and scheduled refresh.
- `REJECTED`: rejected by an operator.

Provider results are reconciled by `(provider_identifier, external_id)`.

## Business Flows

### Collect Offers

1. SAVIS API publishes a component request to `savis.offer.requests`, or SAVIS
   Admin creates a `GET_OFFER` task through HTTP for an exact provider URL.
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

Manual `GET_OFFER` collection selects one provider adapter by name and invokes
its URL retrieval strategy. It does not run the all-provider coverage check
used by `GET_OFFERS`.

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

Collect one known offer:

```json
{
  "type": "GET_OFFER",
  "payload": {
    "search_term": "farine",
    "type": "FOOD",
    "provider": "Maxi",
    "url": "https://www.maxi.ca/example-offer/p/12345"
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

The worker connects over CDP to a Google Chrome process running on the host.
Chrome owns its persistent profile and remains open between tasks. The scraper
blocks media and font requests. New providers must implement the
`OfferProvider` port and be registered by `load_offer_providers()`.

Maxi extraction is separated by page type:

- `list_extractor.py` parses search-result cards and derives a total price from
  the package size and comparison price when required;
- `details_extractor.py` parses one product page, its selling price, stable
  product identity, image, and package size;
- `parsing.py` owns shared money, decimal, unit, and package normalization;
- `models.py` converts provider-specific drafts into core offers;
- `extractor.py` remains a compatibility facade for existing imports.

On product details, an explicit package size is preferred. When it is absent,
the extractor uses the quantity beside the comparison price, for example
`/ 1kg` or `/ 100g`. It intentionally does not use Maxi's average-weight text
as the package size.

Package quantities are normalized to the symbols consumed by SAVIS API,
including `g`, `kg`, `l`, `ml`, and `piece`.

## Failure and Retry Policy

Scraping tasks normally retry unexpected failures with Celery backoff, up to
three retries. The following failures inherit from
`OfferProviderNonRetryableError` and fail immediately:

- Maxi returns HTTP `403` or `429`;
- the expected list or product selector never appears, which usually indicates
  a challenge or access-denied page;
- `BrowserManager` cannot reach the configured Chrome CDP endpoint.

This prevents one access refusal from producing three additional requests.
`ReportingTask` still records the final error on the executor task.

Before each Maxi navigation, the persistent access policy reserves a request
slot. Navigation starts are separated by 1 to 10 minutes by default, and the
reservation survives worker restarts because it is stored in PostgreSQL.

After a block, the circuit opens progressively for 15 minutes, 1 hour, 6 hours,
then 24 hours for subsequent consecutive blocks. Once a cooldown expires, only
one recovery request is reserved. A successful page closes the circuit and
resets the consecutive-block counter; another block advances the cooldown.

The worker runs with `--concurrency=1`. Increasing concurrency would allow
multiple tasks to manipulate the same persistent browser session and is not
supported by the current design.

## Persistence

The executor owns three SQLAlchemy tables:

- `savis_tasks`: task type, payload, status, timestamps, and error.
- `offers`: provider product data, price, package size, review status, offer
  type, and refresh metadata.
- `provider_access_states`: request pacing, consecutive blocks, cooldown, and
  recovery-probe state for each provider.

PostgreSQL uses the `savis_executor` schema by default. At FastAPI startup, the
executor creates the schema when needed and calls `Base.metadata.create_all()`.
The module does not currently use a migration framework.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/postgres` | SQLAlchemy connection URL. |
| `DATABASE_SCHEMA` | `savis_executor` | PostgreSQL schema owned by the executor. |
| `RABBIT_MQ_URL` | `amqp://guest:guest@localhost:5672/%2f` | RabbitMQ URL used by the subscriber, publisher, and Celery. |
| `REDIS_URL` | `redis://localhost:6379/0` | Present in configuration, but not used by the active runtime paths. |
| `BROWSER_CDP_URL` | `http://localhost:9222` | CDP endpoint of the external Google Chrome process. |
| `PROVIDER_MIN_REQUEST_DELAY_SECONDS` | `60` | Minimum delay reserved between provider navigations. |
| `PROVIDER_MAX_REQUEST_DELAY_SECONDS` | `600` | Maximum delay reserved between provider navigations. |
| `PROVIDER_BLOCK_COOLDOWN_SECONDS` | `900,3600,21600,86400` | Progressive cooldowns after consecutive provider blocks. |
| `PROVIDER_PROBE_TIMEOUT_SECONDS` | `1800` | Reservation timeout for the recovery probe after a cooldown. |

The root Docker Compose file provides concrete values from the repository
environment.

## Local Development

Requirements:

- Python 3.14.4 or newer;
- [uv](https://docs.astral.sh/uv/);
- PostgreSQL;
- RabbitMQ;
- Google Chrome running with remote debugging enabled.

Install dependencies:

```bash
uv sync
```

Start each process in a separate terminal:

```bash
uv run fastapi dev
```

On macOS, start the dedicated Chrome session from the repository root:

```bash
make chrome-cdp-start
```

The command is idempotent: it reuses Chrome when port `9222` already responds.
`make run-local` invokes it automatically. Chrome uses
`~/Library/Application Support/Savis/maxi-cdp-profile` by default. Override
`CHROME_CDP_PORT`, `CHROME_CDP_PROFILE_DIR`, or `CHROME_APP_PATH` when needed.

Verify the local endpoint:

```bash
curl http://127.0.0.1:9222/json/version
```

Keep port `9222` private; anyone who can reach it can control the browser.

```bash
RABBIT_MQ_URL="amqp://user:password@localhost:5672/%2f" \
DATABASE_URL="postgresql+psycopg://user:password@localhost:5434/database" \
BROWSER_CDP_URL="http://localhost:9222" \
uv run celery -A app.adapters.celery.celery_app worker \
  --loglevel=info \
  --concurrency=1
```

```bash
uv run celery -A app.adapters.celery.celery_app beat --loglevel=info
```

The API listens on `http://localhost:8000`.

To run the complete SAVIS environment from the repository root:

```bash
docker compose up --build
```

The Dockerfile provides dedicated `api`, `worker`, and `beat` targets. Chrome
runs on the host and Docker Compose connects through
`http://host.docker.internal:9222` on macOS. Celery uses a concurrency of one
so scraping tasks do not compete for the same browser.

## Production Chrome Provisioning

Chrome is host infrastructure, not a process owned by Celery or by the
executor container. Provision it once before the first SAVIS deployment.

On an Ubuntu desktop server:

1. Install Google Chrome stable and `socat`.
2. Run the self-hosted GitHub Actions runner as the graphical desktop user.
3. Check out the SAVIS repository.
4. Install the included user services:

```bash
make install-chrome-cdp-ubuntu
```

`savis-chrome-cdp.service` keeps the visible Chrome process and its dedicated
profile alive. `savis-chrome-cdp-proxy.service` relays host port `9223` to
Chrome's loopback-only CDP port.

The installation script copies the tracked templates from
`deploy/systemd/` to `~/.config/systemd/user/`. They therefore remain installed
when GitHub Actions cleans or replaces its checkout. The script only needs to
be rerun when the unit templates change.

Configure the production Compose environment with:

```env
BROWSER_CDP_URL=http://host.docker.internal:9223
```

The services start with the graphical user session and assume `DISPLAY=:0`.
Adjust the copied unit if the Ubuntu desktop uses another display. The
executor worker and these services must run under a setup where the runner can
access the same user service manager.

Verify the complete path before deploying the executor:

```bash
systemctl --user is-active savis-chrome-cdp.service
systemctl --user is-active savis-chrome-cdp-proxy.service
curl --fail http://127.0.0.1:9222/json/version
curl --fail http://127.0.0.1:9223/json/version
```

Do not expose ports `9222` or `9223` to the public network. Restrict `9223`
with the host firewall to Docker traffic.

Normal SAVIS deployments should not reinstall or restart Chrome. A deployment
job only checks the services and rebuilds the containers:

```bash
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
systemctl --user is-active savis-chrome-cdp.service
systemctl --user is-active savis-chrome-cdp-proxy.service
docker compose \
  --env-file /etc/savis/savis.env \
  up -d --build --remove-orphans
```

See the root [production deployment guide](../README.md#production-deployment)
for the complete server and GitHub Actions procedure.

## Browser Troubleshooting

Check the host services first:

```bash
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
systemctl --user status savis-chrome-cdp.service
systemctl --user status savis-chrome-cdp-proxy.service
curl --fail http://127.0.0.1:9222/json/version
curl --fail http://127.0.0.1:9223/json/version
```

Then verify the endpoint from the worker container:

```bash
docker compose \
  --env-file /etc/savis/savis.env \
  exec executor_worker \
  python -c 'import httpx; print(httpx.get("http://host.docker.internal:9223/json/version", headers={"Host": "localhost:9223"}).json()["Browser"])'
```

Interpret common failures as follows:

- `Cannot connect to external Chrome`: Chrome, the relay, the firewall, or
  `BROWSER_CDP_URL` is unavailable;
- HTTP `403` or `429`: Maxi explicitly refused the current browser/network
  session;
- expected selector timeout: Chrome loaded a challenge or unexpected page.

Restarting SAVIS containers does not reset Chrome. To reset its session, stop
the Chrome service, remove
`~/.local/share/savis/maxi-cdp-profile`, and start the service again. This
deletes all cookies and local storage and may not remove a network-level block.

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
