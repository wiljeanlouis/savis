# SAVIS Architecture

## Project Vision

SAVIS is the information system for SavouretPlus. Its purpose is to support the operational backbone of the business: BOMs/recipes, product and component sourcing, order pricing, catering, decoration services, and future inventory and margin analysis.

The long-term product direction is to turn BOMs and commercial operations into measurable business data:

- BOMs should know their component requirements, activities, and yield;
- components should be linked to real provider offers;
- BOM costs should be calculated from current or selected offer prices and global activity rates;
- order prices and margins should eventually be derived from BOM costs, labor, services, and business rules;
- external provider data should be collected asynchronously because provider collection is slow, failure-prone, and outside the control of the core application.

The architecture therefore separates the stable business model from volatile infrastructure such as HTTP, RabbitMQ, Celery, Playwright, provider websites, and persistence.

## System Overview

SAVIS is currently split into three deployable modules:

- `savis-api`: Java/Spring Boot backend. It owns the main business API, BOM domain, supply domain, persistence, and the public HTTP API consumed by the admin UI.
- `savis-admin`: React/Vite admin back office. It is the user-facing administrative interface for managing BOMs/recipes and future operational data.
- `savis-executor`: Python/FastAPI/Celery executor service. It receives offer collection requests, enqueues background work, executes provider scrapers, and publishes results back to the Java API through RabbitMQ.

Supporting infrastructure:

- PostgreSQL stores SAVIS business data.
- RabbitMQ carries offer request messages from Java to Python and offer result messages from Python to Java.
- Celery executes long-running provider collection and offer refresh tasks.

## Simplified Clean Architecture

SAVIS uses a simplified clean architecture rather than a heavy framework-driven one.

The intended dependency rule is:

```text
Domain / Core
  <- Use cases
    <- Ports
      <- Adapters
        <- Frameworks and infrastructure
```

Inner layers should not know about outer layers. For example, the BOM domain should not know about RabbitMQ, HTTP controllers, JPA, Celery, or Playwright.

### Java API Shape

The Java API follows a feature-oriented clean architecture:

```text
bom/
  domain/
  usecase/
  port/
  adapter/
    web/
    persistence/
    messaging/
    external/

supply/
  domain/
  usecase/
  port/
  adapter/
    web/
    persistence/
    external/
    event/
```

Examples:

- `Bom`, `BomComponent`, `Activity`, `ActivityRate`, and `Yield` are domain objects.
- `BomService` is the BOM use case layer.
- `BomRepositoryPort`, `ActivityRateRepositoryPort`, `ComponentPricePort`, and `ComponentNeededEventPort` are ports.
- `BomController`, JPA repositories, RabbitMQ publisher, and external price adapters are adapters.

### Python Executor Shape

The executor follows the same idea with Python naming:

```text
app/core/
  models.py
  ports.py
  use_case_savis_tasks.py
  use_case_offers.py

app/adapters/
  api/
  celery/
  rabbitmq/
  scrapers/
  database/

app/container.py
```

Examples:

- `Offer`, `Price`, `PackageSize`, and `Provider` are core models.
- `OfferProvider` and `TaskQueue` are core ports.
- `SavisTaskUseCase` creates, enqueues, executes, lists, and cleans up executor tasks.
- `OffersUseCase` runs provider scrapers, reconciles offers, persists tracked offers, and identifies offers due for refresh.
- Celery, Celery Beat, RabbitMQ, FastAPI, SQLAlchemy persistence, and Playwright provider scrapers are adapters.
- `Container` is the composition root for executor dependencies.

## Composition Root and Wiring

Each runtime should have one clear composition root.

In the Python executor, `app/container.py` is responsible for creating concrete objects and injecting them into use cases. Celery is a special runtime because Celery imports task modules by name. To avoid circular imports, Celery-specific dependency resolution is isolated in:

```text
app/adapters/celery/celery_wiring.py
```

The important rule is:

- the container may know concrete adapters;
- core use cases should know only ports;
- adapters should avoid importing the container at module import time unless they are explicit wiring modules;
- Celery queues should enqueue by task name instead of importing task functions directly when that would create cycles.

## Vertical Slicing

SAVIS should evolve by vertical slices, not by horizontal technical layers alone.

A vertical slice contains everything needed for one business capability:

```text
Feature
  domain model
  use case
  port(s)
  adapter(s)
  API contract
  persistence/messaging integration
  UI entry point if needed
```

Current slices:

- BOM management: create, update, list, get, and delete BOMs for food and decoration workflows.
- Activity-rate management: configure one global hourly rate per activity type for BOM activity-cost calculations.
- Component need detection: when a BOM is saved, SAVIS emits component-needed events and lets the executor decide whether provider collection is required.
- Offer collection: component/search term requests are converted into executor tasks and Celery jobs.
- Offer selection and refresh: persisted offers can be searched from the admin UI, selected on BOM components, and invalidated/refreshed through supply workflows.
- Provider scraping: provider-specific scraper implementations extract normalized offers.
- Supply result consumption: Java consumes executor offer results from RabbitMQ and persists/upserts available offers.

This structure keeps business changes local. For example, adding a new provider should mostly touch the executor provider adapter and registration, not the BOM domain. Adding a new BOM pricing policy should mostly touch BOM pricing ports/use cases, not RabbitMQ or Celery.

## Relationship Between Java and Python

Java is the system of record and the owner of business workflows. Python is an execution engine for offer collection.

Java responsibilities:

- expose SAVIS business APIs;
- own BOM and supply domain concepts;
- persist BOMs and supply state;
- persist global activity-rate configuration;
- publish component-needed messages when BOMs are saved;
- receive offer results from Python through RabbitMQ;
- calculate BOM costs from component prices and global activity rates.

Python responsibilities:

- receive offer collection requests from HTTP or RabbitMQ;
- create and persist executor tasks in PostgreSQL;
- enqueue offer collection and refresh work into Celery;
- use Celery Beat to schedule due-offer refresh and stale-task cleanup;
- execute slow provider collection tasks outside the request/consumer path;
- normalize provider-specific data into executor core `Offer` models;
- publish successful offer results to RabbitMQ for the Java API.

The two services communicate in two directions:

```text
Java -> RabbitMQ -> Python subscriber -> Celery
Python Celery task -> RabbitMQ -> Java OffersListener -> OfferService
```

There is also an HTTP entry point on the executor:

```text
Java or caller -> FastAPI /tasks -> Celery
```

This can be useful for direct API-driven offer collection, while RabbitMQ supports event-driven collection.

## Role of Celery

Celery is the async execution layer for offer collection work.

Provider collection should not happen inside:

- a Java HTTP request;
- a FastAPI HTTP request;
- a RabbitMQ message callback.

Those paths should only validate/translate the request and enqueue a Celery task.

Celery owns:

- running long-lived provider scraping logic;
- retrying failed provider collection tasks with backoff;
- isolating slow browser/network work from API responsiveness;
- controlling worker concurrency;
- tracking task failures through `ReportingTask`;

Current Celery tasks include:

```text
app.adapters.celery.celery_tasks.get_offers_task
app.adapters.celery.celery_tasks.refresh_offer_task
app.adapters.celery.celery_tasks.schedule_due_offer_refresh_tasks
app.adapters.celery.celery_tasks.cleanup_stale_savis_tasks
```

The worker resolves the executor task use case, collects or refreshes offers, persists/reconciles them, and publishes result messages to RabbitMQ when needed.

Celery Beat runs as a separate executor process and schedules:

- due-offer refresh every hour;
- stale in-progress task cleanup every 15 minutes.

## Role of the Executor

The executor is not the source of truth. It is a data acquisition service.

Its core job is:

```text
search term -> provider pages -> normalized offers -> RabbitMQ result message
```

Provider-specific logic belongs under:

```text
app/adapters/scrapers/
```

The core model should remain provider-neutral:

- `Offer`
- `Price`
- `PackageSize`
- `Provider`

Provider adapters, such as the Maxi scraper, are responsible for browser/page handling, HTML extraction, parsing, and mapping raw provider data into core offers.

## BOM Pricing

BOM pricing starts in the Java BOM domain.

A BOM contains component requirements, production activities, and yield:

```text
BomComponent
  componentName
  quantity
  selectedOfferId

Activity
  type
  minutes
  sequence

ActivityRate
  activityType
  hourlyRate

Yield
  quantity
  unit
```

The BOM use case resolves component prices through `ComponentPricePort` and loads global activity rates through `ActivityRateRepositoryPort`. The BOM domain then calculates the total from those values:

```text
Bom.calculateTotal(componentPrices, activityRates)
```

This keeps the domain independent from where prices and persisted rates come from.

The intended pricing flow is:

1. A BOM is saved with component requirements, activities, and yield.
2. Components trigger `ComponentNeededEvent`.
3. The executor skips collection only when all configured providers already have offers for the component term and type.
4. The supply side requests or refreshes offers for those components.
5. Collected offers are tracked by the executor and published to Java as available offer results.
6. The admin can search available offers and select one on each component.
7. `ComponentPricePort` resolves selected offer prices, or the cheapest compatible offer when no selected offer exists.
8. `ActivityRateRepositoryPort` loads configured rates by `ActivityType`.
9. `Bom.calculateTotal(...)` sums component costs and activity costs.

Activity costs are calculated from the global rate:

```text
(minutes / 60) * hourlyRate
```

If no rate is configured for an activity type, that activity contributes zero cost. `OfferService.processOffers(...)` saves new offers and updates existing ones by public id or provider/external id.

## Catalog and Public Product Projection

The `catalog` module owns commercial product definitions. A catalog product is
not a BOM. `Product` is a relational aggregate containing purchase modes,
choice options, ingredient options and an ordered collection of common
`ProductBom` references. Each reference stores only a BOM UUID and the quantity
required to sell the product; choices and extras may reference their own BOM.

SAVIS PostgreSQL remains the source of truth for:

- public product content and availability;
- categories and typed product configurations;
- commercial base and purchase-mode prices;
- target margin and BOM references;
- publication state.

Commercial prices are admin decisions. `ProductCostService` resolves BOM costs
through `BomPricingPort`; `ProductPricingService` calculates actual margin,
`GOOD`/`REVIEW`/`LOSS`/`INCOMPLETE` health, the next-$0.25 recommended price,
and a conservative worst case for composable bundles. Recommendations are
consultative and never overwrite a product price.

For ingredient customization, `productBoms` represent the complete default
configuration. Extra BOM cost and extra sale price apply only to quantities
above the default. Removing an ingredient does not reduce the reference cost or
price.

The publication flow is:

```text
SAVIS Admin explicitly publishes
  -> CatalogController
  -> CatalogPublicationService
  -> PublishedCatalogProductMapper
  -> PublishedCatalogPort
  -> Supabase published_catalog_products
  -> Savouretplus
```

Published products are also refreshed periodically using
`savis.catalog.refresh-cron`. The mapper publishes active customer-facing
configuration and prices in cents, but never internal costs, target margins or
common `productBoms`. Supabase is a public projection, not the product system of record.
Orders must retain the price and configuration snapshots accepted by the
customer.

The JPA model uses `ddl-auto=update`. It creates relational catalog tables but
cannot remove the former `catalog_product_definitions` JSONB table, so local
development databases require the one-time reset documented in `README.md`.

## Event Flow

The event-driven offer collection flow is:

```text
Admin saves BOM
  -> BomController
  -> BomService.saveBom(...)
  -> BomRepositoryPort.save(...)
  -> BomService publishes ComponentNeededEvent for components
  -> ComponentNeededEventPort
  -> RabbitMqPublisher
  -> RabbitMQ queue: savis.offer.requests
  -> Python subscriber
  -> SavisTaskUseCase.enqueue_savis_task(...)
  -> skip if every configured provider already has offers for this term/type
  -> CeleryQueue
  -> get_offers_task
  -> SavisTaskUseCase.execute_savis_task(...)
  -> OffersUseCase.get_offers(...)
  -> provider scrapers
  -> track and reconcile normalized offers
  -> RabbitMqResultPublisher
  -> RabbitMQ queue: savis.offer.results
  -> Java OffersListener
  -> OfferService.processOffers(...)
```

Failure tracking flow:

```text
get_offers_task fails after Celery retries
  -> ReportingTask.on_failure(...)
  -> SavisTaskRepository.mark_failed(...)
```

## Retry Flow

There are two different retry concerns.

### RabbitMQ Subscriber Retry

The RabbitMQ subscriber is responsible only for receiving a message and enqueueing a Celery task.

Current behavior:

- `run_forever()` restarts the subscriber if the RabbitMQ connection or consumer crashes.
- `subscribe()` opens one connection and one channel per subscriber lifecycle.
- `basic_qos(prefetch_count=1)` limits unacked messages in the subscriber.
- `auto_ack=False` ensures a message is acknowledged only after enqueueing succeeds.
- callback failure uses `basic_nack(..., requeue=False)` to avoid infinite loops for malformed messages.

Recommended next step: add a dead-letter queue so rejected messages are preserved for inspection instead of being silently discarded.

### Celery Task Retry

Celery owns retrying the actual provider collection and refresh work.

Current behavior:

```text
autoretry_for=(Exception,)
retry_backoff=True
max_retries=3
```

This is appropriate because provider scraping is vulnerable to transient failures: network issues, blocked pages, browser timeouts, provider layout changes, and temporary unavailability.

After retries are exhausted, the executor task is marked failed. Result-level failure publishing to Java is not part of the current implementation.

## Operational Boundaries

The preferred production boundary is:

- Java API process: business API and persistence.
- Admin frontend process: static/admin UI.
- Executor API process: FastAPI routes and lightweight RabbitMQ subscriber if kept in-process.
- Celery worker process: actual provider collection and refresh execution.
- Celery Beat process: periodic due-offer refresh and stale-task cleanup scheduling.
- RabbitMQ: event transport and Celery broker.
- PostgreSQL: business persistence.

Keeping the RabbitMQ subscriber inside FastAPI is acceptable while it only forwards messages to Celery. If the subscriber grows more complex, or if independent scaling is needed, it should become a separate process.

## Architectural Guidelines

- Keep domain objects free from framework annotations unless persistence constraints require an explicit adapter model.
- Prefer ports for cross-slice or infrastructure dependencies.
- Keep provider scraping isolated behind `OfferProvider`.
- Keep Java as the owner of business state.
- Keep Python as the owner of offer collection execution.
- Do not run provider collection synchronously in request handlers or RabbitMQ callbacks.
- Use Celery for slow and retryable work.
- Use RabbitMQ events for business-triggered offer collection and result delivery.
- Keep Java result consumers idempotent because offer result messages may be retried or replayed.
- Treat current supply/pricing persistence as an evolving slice; avoid coupling BOM pricing directly to executor internals.
