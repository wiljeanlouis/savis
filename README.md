# SAVIS

SAVIS is the information system for **SavouretPlus**. It is being built to manage recipes, ingredient sourcing, product/catalog data, order pricing, catering operations, decoration services, and future inventory and margin analysis.

At a high level, SAVIS connects business workflows in Java with asynchronous scraping work in Python:

```text
Recipes and business data
  -> ingredient needs
  -> provider offer scraping
  -> selected offer prices
  -> recipe and order pricing
```

For a deeper architectural explanation, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Project Goals

SAVIS should eventually help SavouretPlus:

- manage recipes and ingredient requirements;
- manage product and provider offer data;
- calculate recipe costs from real ingredient prices;
- calculate order prices and margins;
- support catering and decoration services;
- prepare future inventory, purchasing, automation, and margin reporting features.

## Repository Structure

```text
savis/
  savis-api/       Java Spring Boot backend and business API
  savis-admin/     React admin back office
  savis-scraper/   Python FastAPI, RabbitMQ subscriber, Celery workers, provider scrapers
  docker-compose.yml
  docker-compose.override.yml
  Makefile
  ARCHITECTURE.md
```

## Modules

### SAVIS API

Location: [savis-api](savis-api/README.md)

The Java API is the main business backend. It owns recipe management, supply concepts, persistence, business workflows, and HTTP APIs consumed by the admin UI and scraper callbacks.

Main responsibilities:

- expose recipe and supply endpoints;
- persist business data in PostgreSQL;
- publish ingredient-needed messages to RabbitMQ;
- receive scraped offers and scraping failures from Python;
- calculate recipe costs through domain ports.

### SAVIS Admin

Location: [savis-admin](savis-admin/README.md)

The admin app is the back office UI. It is used by internal users to manage recipes and, over time, operational data such as offers, products, providers, orders, and services.

### SAVIS Scraper

Location: [savis-scraper](savis-scraper/README.md)

The scraper service receives scraping requests, enqueues work into Celery, executes provider-specific scraping logic, normalizes offers, and reports results back to the Java API.

It is intentionally separate from the Java backend because scraping is slow, unstable, retryable, and dependent on external provider websites.

## Technical Stack

### Backend API

- Java 21
- Spring Boot
- Spring Web MVC
- Spring Data JPA
- Spring AMQP
- Spring Modulith
- PostgreSQL
- MapStruct
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

### Scraper

- Python
- FastAPI
- Celery
- RabbitMQ
- Redis
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
- Redis
- Flower for Celery monitoring

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

- `recipe`: recipe domain, recipe use cases, recipe controller, persistence, ingredient-needed messaging.
- `supply`: offer/provider concepts, scraping callbacks, offer request abstractions.
- `scraper`: enqueue scraping, execute scraping, provider scraper adapters, Celery integration, Java callback publisher.

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

- Use business names for domain concepts: `Recipe`, `IngredientRequirement`, `Offer`, `Provider`.
- Use technology names only at adapter boundaries: `RabbitMqProducer`, `CeleryQueue`, `JavaApiPublisher`.
- Prefer ports named after business capabilities: `IngredientPricePort`, `OfferRequestor`, `TaskQueue`.

## Business Flows

### Recipe Creation and Ingredient Need Detection

```text
Admin creates or updates a recipe
  -> Java RecipeController
  -> RecipeService.saveRecipe(...)
  -> recipe is persisted
  -> each ingredient without selectedOfferId emits IngredientNeededEvent
  -> RabbitMqProducer publishes a message to RabbitMQ
```

This allows recipe management to stay fast while provider offer discovery happens asynchronously.

### Offer Scraping Flow

```text
RabbitMQ message: ingredient/search term
  -> Python subscriber
  -> EnqueueScrapingUseCase
  -> CeleryQueue
  -> scrape_offers_task
  -> ExecuteScrapingUseCase
  -> provider scrapers
  -> normalized offers
  -> JavaApiPublisher
  -> Java SupplyController
```

### Recipe Pricing Flow

```text
Recipe
  -> IngredientRequirement[]
  -> selected offer prices
  -> IngredientPricePort
  -> Recipe.calculateTotal(...)
  -> Money total
```

Current note: recipe pricing is in progress. `IngredientPriceAdapter` currently returns a placeholder value and should later resolve real prices from the supply module or persisted offers.

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
scraping task fails
  -> Celery retries with backoff
  -> after max retries, ReportingTask publishes failure to Java
```

## Java/Python Relationship

Java is the business system of record. Python is the scraping execution engine.

Java owns:

- business workflows;
- recipe and supply state;
- persistence;
- pricing decisions;
- admin-facing APIs.

Python owns:

- scraping orchestration;
- provider-specific extraction;
- browser/network scraping;
- retryable background execution;
- reporting scraper results back to Java.

The services should remain loosely coupled. Java should not depend on Python internals, and Python should not own SAVIS business state.

## Docker Services

The default Compose stack contains:

| Service          | Purpose                                               | Port                                               |
| ---------------- | ----------------------------------------------------- | -------------------------------------------------- |
| `postgres`       | Business database                                     | `5434 -> 5432`                                     |
| `redis`          | Celery result backend                                 | `6379`                                             |
| `rabbitmq`       | Message broker and Celery broker                      | `5672`, `15672`                                    |
| `backend_api`    | Java Spring Boot API                                  | `8080`                                             |
| `frontend_admin` | Admin UI                                              | `80` in production, `5173` in development override |
| `scraper_api`    | Python FastAPI scraper API and lightweight subscriber | `8000`                                             |
| `scraper_worker` | Celery worker executing scraping tasks                | internal                                           |
| `scraper_flower` | Celery monitoring                                     | `5555`                                             |

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

The scraper also uses:

```env
RABBIT_MQ_URL=
REDIS_URL=
JAVA_API_URL=
```

In Docker Compose, `RABBIT_MQ_URL` and `REDIS_URL` are provided to scraper services.

## Docker Commands

Start the local development stack:

```bash
make run-local
```

Start the production-style stack:

```bash
make run-prod
```

Stop containers:

```bash
make stop
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
- Scraper API: `http://localhost:8000`
- RabbitMQ management: `http://localhost:15672`
- Flower: `http://localhost:5555`

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

### Scraper

```bash
cd savis-scraper
uv run fastapi dev
uv run celery -A app.adapters.celery.celery_app worker --loglevel=info
uv run ruff check .
```

If using the checked-in virtual environment locally:

```bash
cd savis-scraper
./.venv/bin/python -m compileall -q app
./.venv/bin/ruff check app
```

## Scraper Provider Model

Provider scrapers should implement the core `OfferScraper` port:

```text
OfferScraper.scrape_offers(search_term) -> list[Offer]
```

A provider scraper should:

- isolate provider-specific URLs, browser behavior, selectors, parsing, and normalization;
- return core `Offer` objects;
- avoid leaking provider-specific HTML or DTOs into core use cases;
- fail loudly enough for Celery retry/failure reporting to work.

Adding a provider should generally involve:

1. Create a new provider package under `savis-scraper/app/adapters/scrapers/`.
2. Implement `OfferScraper`.
3. Normalize data into `app.core.models.Offer`.
4. Register the scraper in the scraper loader.
5. Add focused tests or fixtures for parsing behavior.

## Operational Notes

- Do not run scraping directly inside HTTP request handlers.
- Do not run scraping directly inside RabbitMQ callbacks.
- RabbitMQ subscriber callbacks should only validate/translate the message and enqueue Celery work.
- Celery workers should handle slow browser and network work.
- Rejected RabbitMQ messages currently use `requeue=False`; a dead-letter queue should be added before relying on this in production.
- Scraper callbacks to Java should be idempotent where possible.
- Java should remain the source of truth for business state.
- Python should remain the execution engine for external data acquisition.

## Testing and Quality

Recommended quality gates by module:

- Java API: Maven tests and compile checks.
- Admin UI: TypeScript build, ESLint, Vitest.
- Scraper: Ruff, import/compile checks, parser tests, and integration checks with RabbitMQ/Celery where needed.

Before merging changes that touch cross-service flows, verify:

- the Java API starts;
- the scraper API imports and starts;
- the RabbitMQ subscriber can enqueue a Celery task;
- the Celery worker can execute `scrape_offers_task`;
- success and failure callbacks reach the Java supply endpoints.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): architecture vision, clean architecture, slicing, Java/Python relationship, Celery, scraper role, pricing, event flow, and retry flow.
- [savis-api/README.md](savis-api/README.md): Java API module notes.
- [savis-admin/README.md](savis-admin/README.md): admin UI module notes.
- [savis-scraper/README.md](savis-scraper/README.md): scraper module notes.

## Current Status

SAVIS is under active development. The architecture is already oriented around clean boundaries and asynchronous scraping, but some business slices are still evolving:

- real recipe pricing through stored offers is not complete yet;
- supply persistence and offer selection are still being shaped;
- scraper provider coverage is currently limited;
- RabbitMQ rejected-message handling should eventually use a dead-letter queue;
- cross-service integration tests should be added as flows stabilize.
