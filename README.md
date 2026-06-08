# SAVIS

SAVIS is the information system for **SavouretPlus**. It is being built to manage BOMs/recipes, component sourcing, product/catalog data, order pricing, catering operations, decoration services, and future inventory and margin analysis.

At a high level, SAVIS connects BOM management in Java with asynchronous offer collection work in Python:

```text
Food or decoration BOMs
  -> component needs
  -> provider offer collection
  -> selected offer prices
  -> activity rates
  -> BOM, service, and order pricing
```

For a deeper architectural explanation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Project Goals

SAVIS should eventually help SavouretPlus:

- manage BOMs for food recipes, decoration assemblies, and service workflows;
- manage component requirements, activities, and yield;
- manage product and provider offer data;
- configure global hourly activity rates;
- calculate BOM costs from selected provider offers and production activities;
- calculate order prices and margins;
- support catering and decoration services;
- prepare future inventory, purchasing, automation, and margin reporting features.

## Repository Structure

```text
savis/
  savis-api/       Java Spring Boot backend and business API
  savis-admin/     React admin back office
  savis-executor/  Python FastAPI, RabbitMQ subscriber, Celery workers, provider scrapers
  docker-compose.yml
  docker-compose.override.yml
  Makefile
  ARCHITECTURE.md
```

## Modules

### SAVIS API

Location: [savis-api](savis-api/README.md)

The Java API is the main business backend. It owns BOM management, supply
concepts, the sellable product catalog, persistence, business workflows, HTTP
APIs consumed by the admin UI, and RabbitMQ listeners for executor results.

Main responsibilities:

- expose BOM and supply endpoints;
- manage product categories and sellable catalog products;
- reference one or more common BOMs from a product through `ProductBom`;
- analyze product cost, margin health, and recommended prices without changing sale prices;
- publish the customer-facing product projection to Supabase;
- persist business data in PostgreSQL;
- publish component-needed messages to RabbitMQ;
- receive collected offers from Python through RabbitMQ;
- calculate BOM costs through component prices and activity rates.

### SAVIS Admin

Location: [savis-admin](savis-admin/README.md)

The admin app is the back office UI. It is used by internal users to manage
BOMs, BOM components and their executor tasks, activity rates, product
categories, and catalog products. In the BOM form, users define components,
activities, yield, and can select a persisted provider offer for each
component. The catalog form manages common `ProductBom` references separately
from customer choices and ingredient extras.

### SAVIS Executor

Location: [savis-executor](savis-executor/README.md)

The executor service receives offer collection requests, tracks executor tasks, enqueues work into Celery, runs provider adapters, refreshes valid offers on a schedule, normalizes offers, and publishes results back to Java through RabbitMQ.

It is intentionally separate from the Java backend because provider collection is slow, unstable, retryable, and dependent on external provider websites.

## Technical Stack

### Backend API

- Java 25
- Spring Boot
- Spring Web MVC
- Spring Data JPA
- Spring AMQP
- Spring Modulith
- PostgreSQL
- Lombok
- Maven

### Admin UI

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/Radix-style UI components
- Vitest
- ESLint and Prettier

### Executor

- Python
- FastAPI
- Celery
- RabbitMQ
- Playwright
- BeautifulSoup
- httpx
- Pydantic
- Ruff
- uv

### Infrastructure

- Docker Compose
- PostgreSQL
- RabbitMQ with management UI

## Architecture Principles

SAVIS uses a simplified clean architecture with vertical slicing.

The dependency direction should be:

```text
Domain / Core
  <- Use cases
    <- Ports
      <- Adapters
        <- Frameworks and infrastructure
```

Practical rules:

- Domain objects should not know about HTTP, RabbitMQ, Celery, JPA, Playwright, or UI details.
- Use cases coordinate business workflows.
- Ports describe dependencies needed by use cases.
- Adapters implement ports using concrete technologies.
- Runtime wiring belongs in composition roots such as Spring configuration or the Python `Container`.
- Business features should evolve as vertical slices instead of isolated horizontal layers.

## Vertical Slicing

A vertical slice groups everything needed for one business capability:

```text
feature/
  domain/
  usecase/
  port/
  adapter/
    web/
    persistence/
    messaging/
    external/
```

Examples currently present in the repo:

- `bom`: BOM domain, BOM use cases, HTTP API, persistence, component-needed messaging, activities, activity rates, and yield.
- `supply`: offer/provider concepts, persisted offers, offer result/invalidation consumption, and offer search for the admin UI.
- `catalog`: categories, products, `ProductBom` references, purchase modes, choices, extras, pricing analysis, and Supabase publication.
- `executor`: task tracking, offer collection, offer refresh, provider scraper adapters, Celery integration, RabbitMQ result publishing.

## Naming Conventions

### Java

- `domain`: business objects and domain rules.
- `usecase`: application services and workflow orchestration.
- `port`: interfaces required by the domain or use cases.
- `adapter/web`: REST controllers and DTOs.
- `adapter/persistence`: JPA entities, repositories, mappers.
- `adapter/messaging`: RabbitMQ producers/consumers.
- `adapter/external`: clients or adapters to external systems.
- `config`: Spring wiring and feature configuration.

### Python

- `core`: framework-independent models, ports, and use cases.
- `adapters/api`: FastAPI routes and schemas.
- `adapters/celery`: Celery app, queue adapter, tasks, and Celery-specific wiring.
- `adapters/rabbitmq`: RabbitMQ subscriber.
- `adapters/scrapers`: provider-specific scraping implementations.
- `container.py`: dependency composition root.

### General

- Use business names for domain concepts: `Bom`, `BomComponent`, `Activity`, `Yield`, `Offer`, `Provider`.
- Use technology names only at adapter boundaries: `RabbitMqProducer`, `CeleryQueue`, `RabbitMqResultPublisher`.
- Prefer ports named after business capabilities: `ComponentPricePort`, `OfferRequestor`, `TaskQueue`.

## Business Flows

### BOM Creation and Component Need Detection

```text
Admin creates or updates a BOM
  -> Java BomController
  -> BomService.saveBom(...)
  -> BOM is persisted
  -> each component emits ComponentNeededEvent
  -> RabbitMqPublisher publishes a message to RabbitMQ
```

This allows BOM management to stay fast while provider offer discovery happens asynchronously. The Python executor decides whether a `GET_OFFERS` task is actually needed: it skips collection only when every configured provider already has offers for the component search term and offer type.

### Offer Collection Flow

```text
RabbitMQ message: component/search term
  -> Python subscriber
  -> SavisTaskUseCase.enqueue_savis_task(...)
  -> skip if all configured providers already have offers for that term/type
  -> CeleryQueue
  -> get_offers_task
  -> SavisTaskUseCase.execute_savis_task(...)
  -> OffersUseCase.get_offers(...)
  -> provider scrapers
  -> normalized offers
  -> RabbitMqResultPublisher
  -> RabbitMQ queue: savis.offer.results
  -> Java OffersListener
  -> OfferService
```

### BOM Pricing Flow

```text
BOM
  -> BomComponent[]
  -> selected offer prices
  -> ComponentPricePort
  -> Activity[]
  -> ActivityRate by ActivityType
  -> Bom.calculateTotal(...)
  -> Money total
```

Component costs are resolved from selected provider offers, or from the cheapest compatible available offer when no selected offer exists. Activity costs use the global `ActivityRate` configured for each `ActivityType`:

```text
(minutes / 60) * hourlyRate
```

The BOM total is the sum of component costs and activity costs. If an activity type has no configured rate, its activity cost is treated as zero.

### Failure and Retry Flow

RabbitMQ subscriber retry:

```text
subscriber connection fails
  -> run_forever logs the failure
  -> waits a few seconds
  -> opens a new RabbitMQ connection/channel
```

RabbitMQ message handling:

```text
message received
  -> enqueue into Celery succeeds
  -> basic_ack

message cannot be processed
  -> basic_nack(requeue=False)
```

Celery task retry:

```text
provider collection task fails
  -> Celery retries with backoff
  -> after max retries, ReportingTask marks the executor task as failed
```

## Java/Python Relationship

Java is the business system of record. Python is the offer collection execution engine.

Java owns:

- business workflows;
- BOM and supply state;
- persistence;
- pricing decisions, including global activity-rate configuration;
- admin-facing APIs.

Python owns:

- offer collection orchestration;
- provider-specific extraction;
- browser/network collection;
- retryable background execution;
- publishing executor results back to Java through RabbitMQ.

The services should remain loosely coupled. Java should not depend on Python internals, and Python should not own SAVIS business state.

## Docker Services

The default Compose stack contains:

| Service          | Purpose                                               | Port                                               |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `postgres`       | Business database                                     | `5434 -> 5432`                                     |
| `rabbitmq`       | Message broker and Celery broker                      | `5672`, `15672`                                    |
| `backend_api`    | Java Spring Boot API                                  | `8080`                                             |
| `frontend_admin` | Admin UI                                              | `80` in production, `5173` in development override |
| `executor_api`   | Python FastAPI executor API and lightweight RabbitMQ subscriber | `8000`                                             |
| `executor_worker` | Celery worker executing provider collection, refresh, and cleanup tasks | internal                                    |
| `executor_beat` | Celery Beat scheduler for due-offer refresh and stale-task cleanup | internal                                    |

## Environment Files

The Makefile expects:

- `.env.local` for local development;
- `.env` for production-like runs.

Expected variables include:

```env
DB_USER=
DB_PASSWORD=
DB_NAME=
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
RABBIT_MQ_USER=
RABBIT_MQ_PASSWORD=
```

The executor also uses:

```env
RABBIT_MQ_URL=
DATABASE_URL=
```

In Docker Compose, `RABBIT_MQ_URL` and `DATABASE_URL` are provided to executor services.

## Docker Commands

Start the local development stack:

```bash
make run-local
```

This command starts:

- the Supabase local stack and its dedicated PostgreSQL database;
- SAVIS services from `docker-compose.yml`;
- SAVIS API connected to the PostgreSQL database from Docker Compose;
- the SAVIS outbound Supabase adapter;
- automatic local Supabase configuration for the sibling
  `../savouretplus` repository.

SAVIS PostgreSQL remains the system of record. Supabase contains public
projections consumed by Savouretplus. The generated `.env.supabase.local`
file combines the normal local SAVIS variables with the URL and server key
used by the outbound adapter, and is not committed.

### Catalog publication

Products are managed from **Dégustation > Produits** in `savis-admin` and
through `/api/catalog/products`.

The catalog is a relational `Product` aggregate. It owns its purchase modes,
choice group and options, customizable ingredients, and an ordered collection
of common `ProductBom` references with decimal quantities. Each choice or extra
may reference another BOM by UUID. There is deliberately no JPA relationship or
foreign key to the BOM module.

The sale price is always configured explicitly by an admin. BOMs never change
it automatically. They provide current production cost, actual margin, price
health, and a recommended price:

```text
actual margin = (sale price - actual cost) / sale price
raw recommendation = actual cost / (1 - target margin)
recommendation = next upper $0.25 increment
```

`GOOD` means the target margin is met, `REVIEW` means the product remains
profitable below target, `LOSS` means cost exceeds sale price, and `INCOMPLETE`
means at least one required BOM cost is unavailable. Bundle worst-case analysis
uses the most expensive active choice. Ingredient extras are priced and costed
only above their default quantity.

Publication is explicit from the admin and also refreshed hourly by default.
Override the schedule with `SAVIS_CATALOG_REFRESH_CRON`. Only active modes,
choices and ingredients are included in the Supabase projection. Target margin,
common product BOMs, costs and diagnostics remain private in SAVIS.

Supabase stores the public projection expected by Savouretplus in
`published_catalog_products`. Pricing configuration, BOM cost snapshots, and
publication metadata remain in SAVIS. RLS exposes only rows where
`is_available = true`; no additional catalog view is used.

### Catalog persistence

SAVIS currently uses `spring.jpa.hibernate.ddl-auto=update`, not Flyway, for
the Java-owned PostgreSQL schema. Catalog products, categories, common
`ProductBom` references, purchase modes, choice groups/options, and ingredient
options are stored in relational tables under the `savis_api` schema.

Supabase migrations are separate: they define the public
`published_catalog_products` projection and commerce-facing tables. They do
not manage SAVIS API entities.

The Makefile automatically activates Node.js 24 through `nvm` for Supabase
commands. Docker, `nvm`, and Node.js 24 must be installed locally.

Use a different Savouretplus path when necessary:

```bash
make run-local SAVOURETPLUS_DIR=/path/to/savouretplus
```

Start the production-style stack:

```bash
make run-prod
```

Stop containers:

```bash
make stop
```

Inspect or rebuild Supabase:

```bash
make supabase-status
make supabase-reset
```

Follow logs:

```bash
make logs
```

Stop containers and remove volumes:

```bash
make clean
```

Equivalent raw Docker commands:

```bash
docker compose --env-file .env.local up -d --build
docker compose --env-file .env up -d --build
docker compose logs -f
docker compose down
docker compose down -v
```

## Useful URLs

Local development URLs:

- Admin UI: `http://localhost:5173`
- Java API: `http://localhost:8080`
- Executor API: `http://localhost:8000`
- RabbitMQ management: `http://localhost:15672`

Useful admin pages:

- BOMs/recipes: `http://localhost:5173/recipes`
- Activity rates: `http://localhost:5173/activity-rates`

Production-style Compose exposes the admin UI on:

- Admin UI: `http://localhost`

## Development Commands

### Java API

```bash
cd savis-api
./mvnw test
./mvnw spring-boot:run
```

### Admin UI

```bash
cd savis-admin
npm run dev
npm run test
npm run lint
npm run build
```

### Executor

```bash
cd savis-executor
uv run fastapi dev
uv run celery -A app.adapters.celery.celery_app worker --loglevel=info
uv run celery -A app.adapters.celery.celery_app beat --loglevel=info
uv run ruff check .
```

If using the checked-in virtual environment locally:

```bash
cd savis-executor
./.venv/bin/python -m compileall -q app
./.venv/bin/ruff check app
```

## Executor Provider Model

Provider scrapers should implement the core `OfferProvider` port:

```text
OfferProvider.get_offers(search_term) -> list[Offer]
OfferProvider.refresh_offer_price_by_url(url) -> Offer | None
```

A provider scraper should:

- isolate provider-specific URLs, browser behavior, selectors, parsing, and normalization;
- return core `Offer` objects;
- avoid leaking provider-specific HTML or DTOs into core use cases;
- fail loudly enough for Celery retry/failure reporting to work.

Adding a provider should generally involve:

1. Create a new provider package under `savis-executor/app/adapters/scrapers/`.
2. Implement `OfferProvider`.
3. Normalize data into `app.core.models.Offer`.
4. Expose a stable provider `identifier` on the scraper.
5. Register the scraper in the provider loader.
6. Add focused tests or fixtures for parsing behavior.

The executor uses provider identifiers to decide whether an incoming component/search term still needs collection. If a new provider is configured and has no offers yet for an existing term/type, a new `GET_OFFERS` task will be created for that event.

## Operational Notes

- Do not run provider collection directly inside HTTP request handlers.
- Do not run provider collection directly inside RabbitMQ callbacks.
- RabbitMQ subscriber callbacks should only validate/translate the message and enqueue Celery work.
- Celery workers should handle slow browser and network work.
- Rejected RabbitMQ messages currently use `requeue=False`; a dead-letter queue should be added before relying on this in production.
- Executor result publishing and Java result consumption should be idempotent where possible.
- Java should remain the source of truth for business state.
- Python should remain the execution engine for external data acquisition.

## Testing and Quality

Recommended quality gates by module:

- Java API: Maven tests and compile checks.
- Admin UI: TypeScript build, ESLint, Vitest.
- Executor: Ruff, import/compile checks, parser tests, and integration checks with RabbitMQ/Celery where needed.

Before merging changes that touch cross-service flows, verify:

- the Java API starts;
- the executor API imports and starts;
- the RabbitMQ subscriber can enqueue a Celery task from `savis.offer.requests`;
- the Celery worker can execute `get_offers_task`;
- Celery Beat can publish scheduled refresh and stale-task cleanup tasks;
- successful offers are published to `savis.offer.results` and consumed by Java `OffersListener`.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): architecture vision, clean architecture, slicing, Java/Python relationship, Celery, executor role, pricing, event flow, and retry flow.
- [savis-api/README.md](savis-api/README.md): Java API module notes.
- [savis-admin/README.md](savis-admin/README.md): admin UI module notes.
- [savis-executor/README.md](savis-executor/README.md): executor module notes.

## Current Status

SAVIS is under active development. The architecture is already oriented around clean boundaries and asynchronous offer collection, but some business slices are still evolving:

- BOM pricing combines stored offer prices and configured activity rates;
- catalog pricing combines common Product BOMs, choices, and extras to report cost, margin health, and a consultative recommended price without modifying sale prices;
- catalog products and categories are stored relationally in SAVIS and can be published as a limited Supabase projection;
- supply persistence and offer selection exist, while provider coverage and pricing policies are still being shaped;
- executor provider coverage is currently limited;
- RabbitMQ rejected-message handling should eventually use a dead-letter queue;
- cross-service integration tests should be added as flows stabilize.
