# SAVIS

SAVIS is the back-office information system for **SavouretPlus**. It is
organized around three deployable applications with distinct ownership:

- **SAVIS Admin** provides the internal management interface;
- **SAVIS API** owns business rules and business state for BOMs, supply,
  activity rates, and the sellable catalog;
- **SAVIS Executor** owns provider acquisition, executor tasks, and background
  work with explicit retry policies.

Supabase is not the business backend. It is a separate public projection used
by the Savouretplus customer-facing application.

```text
SAVIS Admin --HTTP--> SAVIS API
SAVIS Admin --HTTP--> SAVIS Executor API

SAVIS API --offer requests / RabbitMQ--> SAVIS Executor
SAVIS API <--offer results / RabbitMQ--- SAVIS Executor

SAVIS API ------> PostgreSQL schema savis_api
SAVIS Executor -> PostgreSQL schema savis_executor

SAVIS API --catalog publication--> Supabase --public data--> Savouretplus
```

For the detailed dependency rules and runtime flows, see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Current Capabilities

SAVIS currently supports:

- generic BOMs for food, decoration, activities, packaging, utensils, and
  other resource assemblies;
- BOM components, production activities, yield, and global activity rates;
- provider offer discovery, review, selection, invalidation, refresh, and
  deletion;
- asynchronous executor tasks with Celery retry and scheduled maintenance;
- product categories and sellable catalog products;
- multiple common BOM references per product through `ProductBom`;
- purchase modes, customer choices, bundles, and customizable ingredients;
- product cost, margin health, worst-case, and recommended-price analysis;
- explicit and scheduled publication of a limited catalog projection to
  Supabase.

Future slices include orders, catering operations, decoration services,
inventory, purchasing, and broader margin reporting.

## Repository Structure

```text
savis/
  savis-api/       Java 25 / Spring Boot business API
  savis-admin/     React / Vite administration UI
  savis-executor/  FastAPI / Celery provider acquisition service
  supabase/        Public catalog and commerce projection
  scripts/         Local and deployment helpers
  docker-compose.yml
  docker-compose.override.yml
  Makefile
  docs/
    ARCHITECTURE.md
```

Module documentation:

- [SAVIS API](savis-api/README.md)
- [SAVIS Admin](savis-admin/README.md)
- [SAVIS Executor](savis-executor/README.md)

## Quick Start

### Prerequisites

For the complete local stack:

- Docker with Docker Compose;
- Node.js 22 or newer and `npm`;
- the Supabase CLI, invoked by the Makefile through `npx`;
- a `.env.local` file containing the local database and RabbitMQ credentials.

For development outside Docker:

- Java 25;
- Python 3.14.4 or newer;
- `uv`;
- Maven is available through `savis-api/mvnw`.

### Local Environment

Create `.env.local` at the repository root:

```env
DB_USER=savis
DB_PASSWORD=change-me
DB_NAME=savis
RABBIT_MQ_USER=savis
RABBIT_MQ_PASSWORD=change-me
```

Start SAVIS and the local Supabase stack:

```bash
make run-local
```

The command:

1. starts a dedicated Google Chrome CDP session on macOS;
2. starts Supabase from `supabase/config.toml`;
3. reads its local URL and keys;
4. generates the ignored `.env.supabase.local` file;
5. optionally configures the sibling `../savouretplus` frontend;
6. builds and starts the SAVIS Compose services with the development override.

Use another Savouretplus checkout when necessary:

```bash
make run-local SAVOURETPLUS_DIR=/path/to/savouretplus
```

SAVIS PostgreSQL remains the system of record. Supabase stores only the public
catalog and commerce-facing projection.

## Modules

### SAVIS API

Location: [`savis-api`](savis-api/README.md)

The Java API owns business state and admin-facing workflows.

Main slices:

- `bom`: BOMs, components, activities, yield, activity rates, and BOM pricing;
- `supply`: provider offers consumed from the executor and exposed to BOM
  workflows;
- `catalog`: categories, products, Product BOMs, purchase modes, customer
  options, pricing analysis, and publication;
- `common`: shared value objects such as `Money`, `Quantity`, and `Unit`.

The API persists its entities in the PostgreSQL `savis_api` schema. It publishes
component-needed events to RabbitMQ and consumes executor results and
invalidations.

### SAVIS Admin

Location: [`savis-admin`](savis-admin/README.md)

The React application provides:

- BOM list and editor;
- BOM component offer review and retrieval;
- executor task monitoring nested under the BOM component workflow;
- activity-rate configuration;
- product category creation from a searchable combobox;
- catalog product editing, pricing analysis, and publication.

Frontend features are organized by business capability:

```text
src/features/
  activity-rate/
  bom/
  bom-component/
    task/
  catalog/
  dashboard/
```

### SAVIS Executor

Location: [`savis-executor`](savis-executor/README.md)

The Python service owns external offer acquisition:

- FastAPI exposes offers and executor tasks;
- a RabbitMQ subscriber converts component-needed messages into tasks;
- Celery workers execute provider scraping and refresh jobs;
- Celery Beat schedules due-offer refresh and stale-task cleanup;
- SQLAlchemy persists tracked offers and tasks in the `savis_executor` schema;
- Playwright connects to a host Google Chrome session over CDP;
- successful results and invalidations are published back to Java.

Provider collection remains outside Java and HTTP request handlers because it
is slow and failure-prone. The worker uses concurrency one because all scraping
tasks share the same persistent Chrome session.

### Supabase Projection

Location: [`supabase`](supabase)

Supabase contains:

- `published_catalog_products`: customer-facing product projection;
- `customer_orders`: submitted customer orders;
- `quote_requests`: quote-request payloads;
- RLS policies and grants for public/customer access.

Supabase migrations do not manage JPA entities. The tables in this directory
are the public projection consumed outside the SAVIS API.

## Technical Stack

### API

- Java 25
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- Spring AMQP
- Spring Modulith
- PostgreSQL
- H2 in PostgreSQL mode for tests
- Maven

### Admin

- React 19
- TypeScript 6
- Vite 8
- React Router 7
- TanStack Query and TanStack Table
- Tailwind CSS 4
- shadcn/Radix UI primitives
- Vitest, Testing Library, ESLint, and Prettier

### Executor

- Python 3.14
- FastAPI
- Celery and Celery Beat
- SQLAlchemy and psycopg
- RabbitMQ
- Playwright
- BeautifulSoup and lxml
- Pydantic
- pytest, Ruff, and uv

### Infrastructure

- Docker Compose
- PostgreSQL 18 for SAVIS runtime data
- RabbitMQ with management UI
- local Supabase stack with PostgreSQL 15
- Nginx for the production admin image

## Architecture

SAVIS uses pragmatic clean architecture with vertical slicing.

```text
Domain / Core
  <- Use cases
    <- Ports and public module APIs
      <- Adapters
        <- Frameworks and infrastructure
```

Practical rules:

- domain objects do not depend on HTTP, JPA, RabbitMQ, Celery, Playwright, or
  React;
- use cases coordinate workflows;
- ports describe required capabilities;
- adapters implement persistence, messaging, HTTP, and external integrations;
- Spring configuration and the Python `Container` are composition roots;
- cross-module Java access uses public APIs or ports rather than entity or
  repository access;
- business features evolve as vertical slices.

### Catalog and BOM Boundary

Catalog owns sellable products. BOM owns technical compositions and production
costs.

```text
Catalog Product
  -> BomPricingPort
  -> BomPricingAdapter
  -> BomPricingApi
  -> BOM use case
```

Catalog stores BOM references as UUID values only. It has no JPA association to
BOM entities.

`Product.productBoms` contains common resources required for every sale:

```text
ProductBom
  publicId
  bomId
  quantity > 0
  displayOrder >= 0
```

Create and update reject an unknown common BOM. Choice and ingredient BOMs
remain optional; missing or non-calculable references make pricing analysis
`INCOMPLETE` without preventing the product from being sold.

There is currently no `ProductBomRole`.

## Business Flows

### BOM and Offer Collection

```text
Admin saves a BOM
  -> BomController
  -> BomService
  -> BOM persistence
  -> ComponentNeededEvent per component
  -> RabbitMQ: savis.offer.requests
  -> Executor subscriber
  -> SavisTaskUseCase
  -> Celery get_offers_task
  -> provider scrapers
  -> normalized offers
  -> RabbitMQ: savis.offer.results
  -> Java OffersListener
  -> supply persistence
```

The executor skips a `GET_OFFERS` request only when every configured provider
already has offers for the incoming search term and component type.

### BOM Component Retrieval and Offer Review

```text
Admin requests a BOM component retrieval
  -> Executor API /tasks
  -> SavisTaskUseCase creates GET_OFFER with provider and URL
  -> Celery get_offer_task
  -> selected provider scraper
  -> executor offer persistence
  -> Admin reviews offers in /bom-components
```

Manual retrieval targets one known provider product URL. Automatic BOM
collection continues to use `GET_OFFERS` to search every configured provider.

When an offer is validated, the executor publishes it to Java through
RabbitMQ. When a previously valid offer is rejected or deleted, the executor
publishes an invalidation message so SAVIS API can stop using it.

### Scheduled Offer Refresh

```text
Celery Beat runs hourly
  -> find VALID offers whose next_refresh_at is due
  -> create REFRESH_OFFER tasks
  -> Celery worker refreshes provider price/package
  -> executor persists the refreshed offer
  -> if a valid offer changed, publish the result to SAVIS API
  -> Supply updates the available offer
```

Each reviewed offer has a refresh frequency. Refresh work stays asynchronous
and uses the same task persistence and retry reporting as initial collection.

### Activity Rate Configuration

```text
Admin creates or updates an activity rate
  -> ActivityRateController
  -> ActivityRateService
  -> activity_rates persistence
  -> future BOM pricing reads the new rate by ActivityType
```

Only one activity rate exists per `ActivityType`. BOM activities keep minutes
and type, not copied hourly rates.

### BOM Pricing

```text
BOM component requirements
  -> selected offer or cheapest compatible available offer
  -> component costs

BOM activities
  -> global ActivityRate by ActivityType
  -> (minutes / 60) * hourly rate

BOM total
  = sum(component costs) + sum(activity costs)
```

An activity whose type has no configured rate currently contributes zero.

### Catalog Product Management

```text
Admin creates or updates a product
  -> CatalogController
  -> ProductService
  -> validate category
  -> validate common ProductBom UUIDs through BomPricingPort.exists(...)
  -> catalog relational persistence
```

Product categories can be created from the catalog UI category combobox.
Common `ProductBom` references must point to existing BOMs. Choice and
ingredient BOMs remain optional and are checked during pricing analysis.

### Product Pricing

The unit cost of a BOM reference is:

```text
unitCost(bomId) = BOM total cost / BOM yield quantity
```

Product cost rules:

```text
common cost =
  sum(unitCost(productBom.bomId) * productBom.quantity)

standard =
  common cost

single choice =
  common cost + unitCost(choice.bomId) * purchaseMode.quantity

choice allocation =
  common cost + sum(unitCost(choice.bomId) * allocatedQuantity)

ingredient customization =
  common cost
  + sum(unitCost(ingredient.bomId)
        * max(0, selectedQuantity - defaultQuantity))
```

Without a selected purchase mode, a single choice uses quantity `1`. Removing
an ingredient does not reduce the reference cost, and default extras are not
counted twice.

Pricing analysis reports:

- `GOOD`: target margin is met;
- `REVIEW`: profitable but below target;
- `LOSS`: cost exceeds sale price;
- `INCOMPLETE`: at least one required BOM cost is unavailable.

Recommended prices are rounded up to the next `$0.25` increment and remain
consultative. They never update sale prices automatically.

### Catalog Publication

```text
Admin or scheduled refresh
  -> CatalogPublicationService
  -> PublishedCatalogProductMapper
  -> PublishedCatalogPort
  -> Supabase published_catalog_products
  -> Savouretplus
```

Only products marked `published` are projected. The public payload includes
customer-facing content, active modes, choices, ingredients, and prices in
cents. It excludes common Product BOMs, internal costs, missing-BOM
diagnostics, target margins, and recommended prices.

Publication runs explicitly through the API and hourly by default through
`savis.catalog.refresh-cron`.

### Retry and Scheduling

RabbitMQ callbacks only translate and enqueue work:

```text
enqueue succeeds -> basic_ack
enqueue fails    -> basic_nack(requeue=False)
```

Celery retries unexpected provider failures with backoff. Provider blocks,
challenge pages, and unavailable external Chrome sessions are explicitly
non-retryable because an immediate retry would repeat the same refusal.
`ReportingTask` marks the executor task as failed after either a non-retryable
error or exhausted retries.

Provider navigation starts are persisted and spaced by 1 to 10 minutes by
default. After consecutive blocks, the provider circuit opens for 15 minutes,
1 hour, 6 hours, then 24 hours. After each cooldown, one recovery request is
allowed; a success resets the circuit.

Celery Beat schedules:

- due-offer refresh every hour;
- stale in-progress task cleanup every 15 minutes.

A dead-letter queue for rejected RabbitMQ messages remains future work.

## Persistence

SAVIS uses one PostgreSQL server in Docker with separate schemas:

- `savis_api`: JPA business entities owned by Java;
- `savis_executor`: SQLAlchemy offers and task state owned by Python.

The Java application currently uses
`spring.jpa.hibernate.ddl-auto=update`. Java-owned schema changes do not use
Flyway. API tests use H2 in PostgreSQL compatibility mode with
`ddl-auto=create-drop`.

Catalog persistence is relational:

- `catalog_products`
- `catalog_product_categories`
- `catalog_product_boms`
- `catalog_product_purchase_modes`
- `catalog_product_choice_groups`
- `catalog_product_choice_options`
- `catalog_product_ingredient_options`

Supabase uses its own migrations under `supabase/migrations` and remains a
separate public projection.

## Docker Services

| Service           | Responsibility                                | Host port      |
| ----------------- | --------------------------------------------- | -------------- |
| `postgres`        | SAVIS API and executor PostgreSQL server      | `5434`         |
| `rabbitmq`        | SAVIS event transport and Celery broker       | `5672`         |
| `rabbitmq`        | RabbitMQ management UI                        | `15672`        |
| `backend_api`     | Spring Boot API                               | `8080`         |
| `frontend_admin`  | Nginx admin build or Vite dev server          | `80` or `5173` |
| `executor_api`    | FastAPI and lightweight RabbitMQ subscriber   | `8000`         |
| `executor_worker` | Celery provider collection and refresh worker | internal       |
| `executor_beat`   | Celery periodic scheduler                     | internal       |

The development override mounts source directories, runs Spring Boot through
Maven, starts Vite with hot reload, and starts Uvicorn with reload.

## Configuration

### Compose Environment

Both `.env.local` and the production `.env` use:

```env
DB_USER=
DB_PASSWORD=
DB_NAME=
RABBIT_MQ_USER=
RABBIT_MQ_PASSWORD=
```

`make run-local` generates these additional values in
`.env.supabase.local`:

```env
SUPABASE_ENABLED=true
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional API configuration:

```env
SAVIS_CATALOG_REFRESH_CRON=0 0 * * * *
```

Compose builds the internal datasource, RabbitMQ, and executor database URLs
from the shared credentials.

### Standalone Admin

When running Vite outside Docker:

```env
VITE_API_URL=http://localhost:8080
VITE_EXECUTOR_API_URL=http://localhost:8000
```

`VITE_API_URL` is used with the `/api` prefix. The executor URL defaults to
`http://localhost:8000`.

### Standalone Executor

```env
RABBIT_MQ_URL=amqp://user:password@localhost:5672/%2f
DATABASE_URL=postgresql+psycopg://user:password@localhost:5434/savis
DATABASE_SCHEMA=savis_executor
BROWSER_CDP_URL=http://localhost:9222
PROVIDER_MIN_REQUEST_DELAY_SECONDS=60
PROVIDER_MAX_REQUEST_DELAY_SECONDS=600
PROVIDER_BLOCK_COOLDOWN_SECONDS=900,3600,21600,86400
PROVIDER_PROBE_TIMEOUT_SECONDS=1800
```

Never commit real credentials. Root environment files and generated Supabase
configuration are ignored by Git.

## Production Deployment

The expected production target is an Ubuntu host running:

- Docker Engine with Docker Compose;
- a graphical desktop session;
- Google Chrome stable and `socat`;
- a self-hosted GitHub Actions runner;
- the SAVIS Compose services.

The GitHub runner should run as the same Ubuntu user that owns the graphical
session and the Chrome `systemd --user` services.

### One-Time Server Provisioning

Install Docker, Google Chrome stable, and `socat` on the Ubuntu host. Register
the GitHub Actions runner under the graphical Ubuntu user.

After the repository has been checked out on the server, install the Chrome
services once:

```bash
make install-chrome-cdp-ubuntu
```

The installer reads the unit templates from
`savis-executor/deploy/systemd/`, copies them to
`~/.config/systemd/user/`, and starts them. The copied units and the Chrome
profile remain on the server independently of the GitHub Actions checkout and
future SAVIS deployments.

The services require an active graphical session and assume `DISPLAY=:0`.
Adjust `~/.config/systemd/user/savis-chrome-cdp.service` if the production
display differs, then reload and restart it:

```bash
systemctl --user daemon-reload
systemctl --user restart savis-chrome-cdp.service
```

Verify the browser and Docker relay:

```bash
systemctl --user is-active savis-chrome-cdp.service
systemctl --user is-active savis-chrome-cdp-proxy.service
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9223/json/version
```

Port `9223` gives control of the browser. Restrict it with the host firewall so
it is reachable by Docker but not from the public network.

### Production Environment

Store the production environment outside Git, for example at
`/etc/savis/savis.env`, and grant read access only to the deployment user:

```env
DB_USER=
DB_PASSWORD=
DB_NAME=
RABBIT_MQ_USER=
RABBIT_MQ_PASSWORD=
BROWSER_CDP_URL=http://host.docker.internal:9223
PROVIDER_MIN_REQUEST_DELAY_SECONDS=60
PROVIDER_MAX_REQUEST_DELAY_SECONDS=600
PROVIDER_BLOCK_COOLDOWN_SECONDS=900,3600,21600,86400
PROVIDER_PROBE_TIMEOUT_SECONDS=1800
SUPABASE_ENABLED=true
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Add any other application-specific production variables required by the API
or admin frontend. Never commit this file.

### GitHub Actions CI/CD

Pull requests and pushes to `main` run `.github/workflows/ci.yml` on
GitHub-hosted runners. The production runner must never run pull-request code.

Create an immutable release by tagging a commit contained in `main`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The release workflow tests the repository, publishes the API, Admin, and
Executor images to GHCR, records their digests, publishes BuildKit provenance
and SBOM metadata, and attaches a checksummed deployment package to the GitHub
Release. GitHub artifact attestations are disabled because private repositories
require GitHub Enterprise Cloud for that feature.

Deploy from the `Deploy production` workflow by entering an existing SemVer
such as `v1.0.0`. The job runs only on a runner labelled
`self-hosted,linux,x64,production` and uses the protected GitHub Environment
named `production`.

Configure that environment with at least one required reviewer. Protect
`main` by requiring the `CI successful` check, one approving review, and
disabling direct pushes.

The runner user must have permission to use Docker, access its user-level
Chrome services, and read `/etc/savis/savis.env`. Add `SUPABASE_DB_URL` to that
file when `SUPABASE_ENABLED=true`; it is used only by the deployment migration
step.

After deployment, verify at minimum:

```bash
docker compose \
  --env-file /etc/savis/savis.env \
  --env-file ~/.local/share/savis/deploy/current/release.env \
  -f ~/.local/share/savis/deploy/current/compose.prod.yml \
  ps
curl --fail http://127.0.0.1:8088/health
```

## Commands

Show available Make targets:

```bash
make help
```

Start local development with Supabase:

```bash
make run-local
```

Start only the macOS Chrome CDP session:

```bash
make chrome-cdp-start
```

Install and start the persistent Chrome CDP services on Ubuntu:

```bash
make install-chrome-cdp-ubuntu
```

Production Docker uses the Ubuntu relay:

```env
BROWSER_CDP_URL=http://host.docker.internal:9223
```

Start the production Compose targets using `.env`:

```bash
make run-prod
```

Operate the stack:

```bash
make logs
make stop
make clean
```

`make clean` removes SAVIS Docker volumes and stops Supabase without preserving
its local database.

Operate local Supabase:

```bash
make supabase-status
make supabase-reset
```

Raw Compose equivalents:

```bash
docker compose --env-file .env.supabase.local up -d --build
docker compose --env-file .env up -d --build
docker compose logs -f
docker compose down
docker compose down -v
```

## Local URLs

### SAVIS

- Admin UI: `http://localhost:5173`
- Java API: `http://localhost:8080`
- Java Swagger UI: `http://localhost:8080/swagger-ui.html`
- Executor API: `http://localhost:8000`
- Executor OpenAPI UI: `http://localhost:8000/docs`
- RabbitMQ management: `http://localhost:15672`
- PostgreSQL: `localhost:5434`

The production admin Compose target is exposed at `http://localhost`.

### Supabase

- API: `http://127.0.0.1:54321`
- PostgreSQL: `localhost:54322`
- Studio: `http://127.0.0.1:54323`
- Inbucket: `http://127.0.0.1:54324`

### Admin Routes

- Dashboard: `http://localhost:5173/dashboard`
- BOMs: `http://localhost:5173/boms`
- New BOM: `http://localhost:5173/boms/add`
- BOM components: `http://localhost:5173/bom-components`
- Retrieval tasks: `http://localhost:5173/bom-components/tasks`
- Activity rates: `http://localhost:5173/activity-rates`
- Catalog products: `http://localhost:5173/catalog-products`

## Module Development

### Java API

```bash
cd savis-api
./mvnw test
./mvnw spring-boot:run
```

The default application configuration expects PostgreSQL on port `5432`.
Override `SPRING_DATASOURCE_URL` when using the Compose database exposed on
port `5434`.

### Admin

```bash
cd savis-admin
npm install
npm run dev
npm test -- --run
npm run lint
npm run build
```

### Executor

```bash
cd savis-executor
uv sync
uv run fastapi dev
uv run celery -A app.adapters.celery.celery_app worker --loglevel=info
uv run celery -A app.adapters.celery.celery_app beat --loglevel=info
uv run pytest
uv run ruff check .
```

The API, worker, and Beat scheduler are separate processes.

## Provider Adapters

Provider scrapers implement the core `OfferProvider` port:

```text
OfferProvider.get_offers(search_term) -> list[Offer]
OfferProvider.get_offer_by_url(url) -> Offer | None
```

A provider adapter should:

1. isolate provider URLs, browser behavior, selectors, parsing, and
   normalization;
2. return provider-neutral core `Offer` objects;
3. expose a stable provider identifier;
4. classify blocks and configuration failures as
   `OfferProviderNonRetryableError`, while allowing transient failures to reach
   Celery retry and failure reporting;
5. include focused parser or adapter tests.

New providers are registered in the executor provider loader. Provider
identifiers are also used to determine whether an existing search term still
needs collection.

## Testing and Quality

Expected checks by module:

```bash
# Java
cd savis-api
./mvnw test

# Admin
cd savis-admin
npm test -- --run
npm run lint
npm run build

# Executor
cd savis-executor
uv run pytest
uv run ruff check .
```

For cross-service changes, also verify:

- the Java API and executor API start;
- RabbitMQ requests create executor tasks;
- Celery workers execute collection and refresh tasks;
- Celery Beat publishes scheduled jobs;
- successful results are consumed by Java;
- catalog publication reaches the local Supabase projection.

## Operational Guidelines

- Keep provider collection out of HTTP handlers and RabbitMQ callbacks.
- Keep RabbitMQ callbacks limited to validation, translation, and enqueueing.
- Keep Java result consumers idempotent because messages may be replayed.
- Keep SAVIS API as the owner of business state.
- Keep the executor as the owner of acquisition execution and task state.
- Keep Supabase as a public projection, not the catalog source of truth.
- Treat recommended prices as advisory.
- Do not introduce JPA relationships across the Catalog/BOM module boundary.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [SAVIS API](savis-api/README.md)
- [SAVIS Admin](savis-admin/README.md)
- [SAVIS Executor](savis-executor/README.md)

## Current Status

SAVIS is under active development.

Implemented foundations:

- clean module boundaries and vertical slices;
- asynchronous offer acquisition and refresh;
- relational BOM, supply, and catalog persistence;
- multiple common Product BOMs and generic product cost calculation;
- admin workflows for BOMs, offers, tasks, rates, categories, and products;
- Supabase catalog publication.

Known areas still evolving:

- provider coverage and scraper resilience;
- dead-letter handling for rejected RabbitMQ messages;
- cross-service integration test coverage;
- order, inventory, purchasing, catering, and decoration workflows;
- production hardening, observability, and deployment automation.
