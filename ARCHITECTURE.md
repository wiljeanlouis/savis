# SAVIS Architecture

## Project Vision

SAVIS is the information system for SavouretPlus. Its purpose is to support the operational backbone of the business: recipes, product and ingredient sourcing, order pricing, catering, decoration services, and future inventory and margin analysis.

The long-term product direction is to turn recipes and commercial operations into measurable business data:

- recipes should know their ingredient requirements;
- ingredients should be linked to real provider offers;
- recipe costs should be calculated from current or selected offer prices;
- order prices and margins should eventually be derived from recipe costs, labor, services, and business rules;
- external provider data should be collected asynchronously because provider collection is slow, failure-prone, and outside the control of the core application.

The architecture therefore separates the stable business model from volatile infrastructure such as HTTP, RabbitMQ, Celery, Playwright, provider websites, and persistence.

## System Overview

SAVIS is currently split into three deployable modules:

- `savis-api`: Java/Spring Boot backend. It owns the main business API, recipe domain, supply domain, persistence, and the public HTTP API consumed by the admin UI.
- `savis-admin`: React/Vite admin back office. It is the user-facing administrative interface for managing recipes and future operational data.
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

Inner layers should not know about outer layers. For example, the recipe domain should not know about RabbitMQ, HTTP controllers, JPA, Celery, or Playwright.

### Java API Shape

The Java API follows a feature-oriented clean architecture:

```text
recipe/
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

- `Recipe` and `IngredientRequirement` are domain objects.
- `RecipeService` is the recipe use case layer.
- `RecipeRepositoryPort`, `IngredientPricePort`, and `IngredientNeededEventPort` are ports.
- `RecipeController`, JPA repositories, RabbitMQ producer, and external price adapters are adapters.

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
  cleanup/

app/container.py
```

Examples:

- `Offer`, `Price`, `PackageSize`, and `Provider` are core models.
- `OfferProvider` and `TaskQueue` are core ports.
- `SavisTaskUseCase` creates, enqueues, executes, lists, and cleans up executor tasks.
- `OffersUseCase` runs provider scrapers, reconciles offers, persists tracked offers, and schedules refresh work.
- Celery, RabbitMQ, FastAPI, SQLAlchemy persistence, cleanup runners, and Playwright provider scrapers are adapters.
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

- Recipe management: create, update, list, get, and delete recipes.
- Ingredient need detection: when a recipe contains an ingredient with no selected offer, SAVIS emits an ingredient-needed event.
- Offer collection: ingredient/search term requests are converted into executor tasks and Celery jobs.
- Offer review and refresh: reviewed offers can be marked valid or rejected, and valid offers can be refreshed by URL.
- Provider scraping: provider-specific scraper implementations extract normalized offers.
- Supply result consumption: Java consumes executor offer results from RabbitMQ.

This structure keeps business changes local. For example, adding a new provider should mostly touch the executor provider adapter and registration, not the recipe domain. Adding a new recipe pricing policy should mostly touch recipe pricing ports/use cases, not RabbitMQ or Celery.

## Relationship Between Java and Python

Java is the system of record and the owner of business workflows. Python is an execution engine for offer collection.

Java responsibilities:

- expose SAVIS business APIs;
- own recipe and supply domain concepts;
- persist recipes and supply state;
- decide when an ingredient needs provider offers;
- publish ingredient-needed messages;
- receive offer results from Python through RabbitMQ;
- calculate recipe costs through `IngredientPricePort`.

Python responsibilities:

- receive offer collection requests from HTTP or RabbitMQ;
- create and persist executor tasks in PostgreSQL;
- enqueue offer collection and refresh work into Celery;
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

The current task is:

```text
app.adapters.celery.celery_tasks.get_offers_task
```

It resolves the executor task use case, collects offers, persists/reconciles them, and publishes valid results to RabbitMQ.

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

## Recipe Pricing

Recipe pricing starts in the Java recipe domain.

A recipe contains ingredient requirements:

```text
IngredientRequirement
  ingredientName
  quantity
  selectedOfferId
```

The recipe domain calculates total cost through the `IngredientPricePort`:

```text
Recipe.calculateTotal(IngredientPricePort)
```

This keeps the domain independent from where prices come from.

The intended pricing flow is:

1. A recipe is saved with ingredient requirements.
2. Ingredients without `selectedOfferId` trigger `IngredientNeededEvent`.
3. The supply side requests or refreshes offers for those ingredients.
4. Collected offers are tracked by the executor and published to Java when valid.
5. An admin or automated policy selects the offer to use for each ingredient.
6. `IngredientPricePort` resolves selected offer prices.
7. `Recipe.calculateTotal(...)` sums ingredient costs.

Current implementation note: `IngredientPriceAdapter` currently returns a placeholder value. `OfferService.processOffers(...)` receives result messages but persistence and reconciliation in the Java supply module are still being shaped.

## Event Flow

The event-driven offer collection flow is:

```text
Admin saves recipe
  -> RecipeController
  -> RecipeService.saveRecipe(...)
  -> RecipeRepositoryPort.save(...)
  -> RecipeService publishes IngredientNeededEvent for ingredients without selected offers
  -> IngredientNeededEventPort
  -> RabbitMqProducer
  -> RabbitMQ queue: savis.offer.requests
  -> Python subscriber
  -> SavisTaskUseCase.enqueue_savis_task(...)
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
- Treat current supply/pricing persistence as an evolving slice; avoid coupling recipe pricing directly to executor internals.
