# SAVIS Architecture

This document describes SAVIS using the C4 model:

- **Level 1 - System Context**: who uses SAVIS and which external systems it
  interacts with.
- **Level 2 - Containers**: deployable applications and infrastructure.
- **Level 3 - Components**: important modules inside each container.
- **Dynamic views**: runtime flows that cross container boundaries.

SAVIS is the back-office system for SavouretPlus. It currently supports BOMs,
provider offers, activity rates, sellable catalog products, product cost
analysis, and asynchronous offer collection. Future slices include orders,
inventory, purchasing, catering, decoration operations, and broader margin
reporting.

## Diagram Conventions

Each diagram states its C4 abstraction level. Labels explicitly identify
people, software systems, containers, or components. Mermaid `flowchart`
syntax is used for portable rendering, while sequence diagrams provide
supplementary dynamic views. Code-level diagrams (C4 Level 4) are intentionally
omitted because the code is still evolving and those details are better kept in
source and tests.

## Architectural Drivers

- Keep Java as the source of truth for SAVIS business state.
- Keep provider acquisition outside request handlers because scraping is slow,
  unstable, and retryable.
- Keep Catalog independent from BOM internals; Catalog references BOMs by UUID
  and uses a public BOM pricing API.
- Keep Supabase as a public projection, not the product system of record.
- Organize code by vertical slices and enforce inward dependencies through
  domain objects, use cases, ports, and adapters.

## C4 Level 1 - System Context

```mermaid
flowchart LR
  AdminUser["Person<br/>Internal SAVIS user"]
  Customer["Person<br/>Customer"]
  SAVIS["Software System<br/>SAVIS<br/>Back-office operations and pricing"]
  Provider["External System<br/>Provider websites"]
  Savouretplus["External System<br/>Savouretplus customer-facing app"]
  Supabase["External System<br/>Supabase public projection"]

  AdminUser -->|manages BOMs, offers, tasks, rates, catalog| SAVIS
  SAVIS -->|collects and refreshes offers| Provider
  SAVIS -->|publishes catalog data| Supabase
  Savouretplus -->|reads catalog; submits orders and quotes| Supabase
  Customer -->|orders and quote requests| Savouretplus
```

### Context Notes

- **SAVIS Admin** is internal. It is not the public storefront.
- **SAVIS API** owns business concepts: BOM, Supply, Activity Rate, Catalog.
- **SAVIS Executor** owns external provider acquisition and executor tasks.
- **Supabase** exposes public commerce-facing data to Savouretplus.
- Provider websites are volatile external dependencies and must not leak into
  Java domain models.

## C4 Level 2 - Container View

```mermaid
flowchart LR
  subgraph SAVIS["Software System: SAVIS"]
    Admin["Container<br/>React/Vite SAVIS Admin"]
    Api["Container<br/>Java 25 / Spring Boot SAVIS API"]
    ExecutorApi["Container<br/>Python FastAPI Executor API<br/>and RabbitMQ subscriber"]
    Worker["Container<br/>Celery Worker<br/>Provider scraping and refresh"]
    Beat["Container<br/>Celery Beat<br/>Periodic scheduler"]
    Rabbit[("Container<br/>RabbitMQ")]
    PgApi[("Container<br/>PostgreSQL schema savis_api")]
    PgExecutor[("Container<br/>PostgreSQL schema savis_executor")]
  end

  Supabase[("External System<br/>Supabase public projection")]
  Providers["External System<br/>Provider websites"]
  Savouretplus["External System<br/>Savouretplus"]

  Admin -->|HTTP /api| Api
  Admin -->|HTTP /offers, /tasks| ExecutorApi

  Api -->|JPA| PgApi
  Api -->|publish catalog| Supabase
  Api -->|savis.offer.requests| Rabbit
  Rabbit -->|savis.offer.results<br/>savis.offer.invalidations| Api

  ExecutorApi -->|SQLAlchemy| PgExecutor
  ExecutorApi -->|enqueue Celery tasks| Rabbit
  Rabbit -->|messages| ExecutorApi

  Worker -->|SQLAlchemy| PgExecutor
  Worker -->|Celery broker| Rabbit
  Worker -->|scrape / refresh| Providers
  Worker -->|publish results| Rabbit

  Beat -->|scheduled tasks| Rabbit
  Savouretplus -->|read public catalog| Supabase
```

### Container Responsibilities

| Container            | Responsibility                                                                        | Persistence                        |
| -------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| `savis-admin`        | Internal UI for BOMs, offers, tasks, activity rates, categories, and catalog products | Browser state only                 |
| `savis-api`          | Business workflows and source of truth for BOM, Supply, Catalog, Activity Rate        | PostgreSQL schema `savis_api`      |
| `savis-executor` API | Executor HTTP API and lightweight RabbitMQ subscriber                                 | PostgreSQL schema `savis_executor` |
| Celery worker        | Slow provider collection and offer refresh                                            | PostgreSQL schema `savis_executor` |
| Celery Beat          | Due-offer refresh and stale-task cleanup scheduling                                   | Celery broker state                |
| RabbitMQ             | Offer request/result transport and Celery broker                                      | Broker queues                      |
| Supabase             | Public catalog, customer order, and quote-request projection                          | Supabase PostgreSQL                |

## C4 Level 3 - SAVIS API Components

```mermaid
flowchart TB
  subgraph Api[SAVIS API]
    subgraph Bom[BOM slice]
      BomWeb["Component<br/>BomController<br/>ActivityRateController"]
      BomUse["Component<br/>BomService<br/>ActivityRateService"]
      BomDomain["Component<br/>Bom, BomComponent<br/>Activity, Yield"]
      BomPorts["Component<br/>BomRepositoryPort<br/>ComponentPricePort<br/>ComponentNeededEventPort<br/>BomPricingApi"]
      BomAdapters["Component<br/>JPA adapters<br/>RabbitMQ publisher<br/>Supply price adapter"]
    end

    subgraph Supply[Supply slice]
      SupplyWeb["Component<br/>SupplyOfferController"]
      SupplyUse["Component<br/>OfferService"]
      SupplyDomain["Component<br/>Offer, Provider<br/>PackageSize"]
      SupplyPorts["Component<br/>OfferRepository<br/>Offer result ports"]
      SupplyAdapters["Component<br/>JPA adapters<br/>RabbitMQ listeners"]
    end

    subgraph Catalog[Catalog slice]
      CatalogWeb["Component<br/>CatalogController<br/>ProductCategoryController"]
      CatalogUse["Component<br/>ProductService<br/>ProductCostService<br/>ProductPricingService<br/>CatalogPublicationService"]
      CatalogDomain["Component<br/>Product, ProductBom<br/>PurchaseMode, Choice<br/>Ingredient"]
      CatalogPorts["Component<br/>ProductRepository<br/>ProductCategoryRepository<br/>BomPricingPort<br/>PublishedCatalogPort"]
      CatalogAdapters["Component<br/>JPA adapters<br/>BomPricingAdapter<br/>Supabase adapter"]
    end

    Common["Component<br/>common<br/>Money, Quantity, Unit"]
  end

  BomWeb --> BomUse --> BomDomain
  BomUse --> BomPorts --> BomAdapters

  SupplyWeb --> SupplyUse --> SupplyDomain
  SupplyUse --> SupplyPorts --> SupplyAdapters

  CatalogWeb --> CatalogUse --> CatalogDomain
  CatalogUse --> CatalogPorts --> CatalogAdapters
  CatalogAdapters -->|BomPricingApi| BomUse

  BomDomain --> Common
  SupplyDomain --> Common
  CatalogDomain --> Common
```

### API Component Rules

- Domain objects contain business rules and avoid framework dependencies.
- Use cases coordinate validation, persistence, pricing, messaging, and
  publication.
- Ports express dependencies needed by use cases.
- Adapters implement web, persistence, messaging, external integration, and
  cross-module access.
- Catalog does not depend on BOM persistence or entities. It uses
  `BomPricingPort`, implemented by `BomPricingAdapter`, which calls the public
  BOM `BomPricingApi`.

## C4 Level 3 - SAVIS Executor Components

```mermaid
flowchart TB
  subgraph Executor[SAVIS Executor]
    ApiRoutes["Component<br/>FastAPI routes<br/>/offers, /tasks"]
    Subscriber["Component<br/>RabbitMQ subscriber"]
    CeleryTasks["Component<br/>Celery tasks"]
    BeatScheduler["Component<br/>Celery Beat schedules"]
    Container["Component<br/>Container composition root"]

    subgraph Core[Core]
      Models["Component<br/>Offer, Provider<br/>SavisTask, Price"]
      OffersUseCase["Component<br/>OffersUseCase"]
      TaskUseCase["Component<br/>SavisTaskUseCase"]
      Ports["Component<br/>OfferProvider<br/>TaskQueue<br/>OfferRepository<br/>SavisTaskRepository<br/>OfferPublisher"]
    end

    subgraph Adapters[Adapters]
      Database["Component<br/>SQLAlchemy repositories"]
      Queue["Component<br/>CeleryQueue"]
      Publisher["Component<br/>RabbitMQ result publisher"]
      Scrapers["Component<br/>Provider scrapers<br/>Maxi, future providers"]
    end
  end

  ApiRoutes --> Container
  Subscriber --> Container
  CeleryTasks --> Container
  BeatScheduler --> CeleryTasks

  Container --> OffersUseCase
  Container --> TaskUseCase

  OffersUseCase --> Models
  OffersUseCase --> Ports
  TaskUseCase --> Models
  TaskUseCase --> Ports

  Ports --> Database
  Ports --> Queue
  Ports --> Publisher
  Ports --> Scrapers
```

### Executor Component Rules

- Core models and use cases are provider-neutral.
- Provider-specific selectors, parsing, Playwright behavior, and HTML handling
  live under scraper adapters.
- HTTP routes and RabbitMQ callbacks only validate, translate, and enqueue.
- Celery executes slow and retryable work.
- Failed Celery tasks are reported to executor task persistence through
  `ReportingTask`.

## C4 Level 3 - SAVIS Admin Components

```mermaid
flowchart TB
  subgraph Admin[SAVIS Admin]
    Router["Component<br/>AppRouter"]
    Layout["Component<br/>MainLayout<br/>AppSidebar<br/>Breadcrumbs"]
    Shared["Component<br/>shared API clients<br/>shared UI components"]

    subgraph Features[src/features]
      Dashboard["Component<br/>dashboard"]
      BomFeature["Component<br/>bom"]
      BomComponent["Component<br/>bom-component"]
      BomComponentTask["Component<br/>bom-component/task"]
      ActivityRate["Component<br/>activity-rate"]
      CatalogFeature["Component<br/>catalog"]
    end
  end

  Router --> Layout
  Router --> Dashboard
  Router --> BomFeature
  Router --> BomComponent
  BomComponent --> BomComponentTask
  Router --> ActivityRate
  Router --> CatalogFeature

  BomFeature --> Shared
  BomComponent --> Shared
  BomComponentTask --> Shared
  ActivityRate --> Shared
  CatalogFeature --> Shared
```

### Admin Routes

| Route                   | Feature                  |
| ----------------------- | ------------------------ |
| `/dashboard`            | dashboard                |
| `/boms`                 | BOM list                 |
| `/boms/add`             | BOM creation             |
| `/boms/:id`             | BOM editing              |
| `/bom-components`       | reviewed provider offers |
| `/bom-components/tasks` | executor task monitoring |
| `/activity-rates`       | global hourly rates      |
| `/catalog-products`     | product catalog          |

Executor tasks are colocated under `bom-component/task` because they are a
technical detail of retrieving and refreshing BOM component offers.

## Dynamic View - BOM Offer Collection

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Api as SAVIS API
  participant Rabbit as RabbitMQ
  participant Executor as Executor API subscriber
  participant Worker as Celery worker
  participant Provider as Provider website
  participant PgExec as savis_executor
  participant Supply as Supply slice

  Admin->>Api: Save BOM
  Api->>Api: Persist BOM
  Api->>Rabbit: Publish ComponentNeededEvent
  Rabbit->>Executor: Consume offer request
  Executor->>PgExec: Create GET_OFFERS task if providers are missing
  Executor->>Rabbit: Enqueue Celery task
  Rabbit->>Worker: Deliver get_offers_task
  Worker->>Provider: Scrape provider offers
  Worker->>PgExec: Reconcile offers and complete task
  Worker->>Rabbit: Publish offer results
  Rabbit->>Supply: Deliver results
  Supply->>Supply: Upsert offers in savis_api
```

## Dynamic View - Manual Retrieval and Offer Review

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Executor as Executor API
  participant TaskUseCase as SavisTaskUseCase
  participant Worker as Celery worker
  participant OfferUseCase as OffersUseCase
  participant PgExec as savis_executor
  participant Rabbit as RabbitMQ
  participant Supply as SAVIS API Supply slice

  Admin->>Executor: POST /tasks GET_OFFERS
  Executor->>TaskUseCase: enqueue_savis_task(payload)
  TaskUseCase->>PgExec: Persist IN_PROGRESS task
  TaskUseCase->>Rabbit: Enqueue get_offers_task
  Rabbit->>Worker: Deliver task
  Worker->>OfferUseCase: Collect and reconcile offers
  OfferUseCase->>PgExec: Persist NEW offers
  Worker->>PgExec: Mark task COMPLETED
  Admin->>Executor: GET /offers
  Executor-->>Admin: Paged offers
  Admin->>Executor: PATCH offer status
  alt offer becomes VALID
    Executor->>Rabbit: Publish offer result
    Rabbit->>Supply: Upsert available offer
  else valid offer becomes REJECTED or is deleted
    Executor->>Rabbit: Publish offer invalidation
    Rabbit->>Supply: Mark offer unavailable
  end
```

Task creation may return a conflict when all configured providers already have
offers for the requested search term and component type.

## Dynamic View - Scheduled Offer Refresh

```mermaid
sequenceDiagram
  participant Beat as Celery Beat
  participant Rabbit as RabbitMQ
  participant TaskUseCase as SavisTaskUseCase
  participant PgExec as savis_executor
  participant Worker as Celery worker
  participant Offers as OffersUseCase
  participant Provider as Provider website
  participant Supply as SAVIS API Supply slice

  Beat->>Rabbit: schedule_due_offer_refresh_tasks
  Rabbit->>Worker: Deliver scheduler task
  Worker->>TaskUseCase: enqueue_due_offer_refresh_tasks()
  TaskUseCase->>Offers: Find VALID offers due for refresh
  Offers->>PgExec: Query next_refresh_at
  loop each due offer
    TaskUseCase->>PgExec: Persist task
    TaskUseCase->>Rabbit: Enqueue refresh_offer_task
    Rabbit->>Worker: Deliver refresh task
    Worker->>Provider: Refresh price and package
    Worker->>PgExec: Persist refreshed offer and task status
    alt valid offer changed
      Worker->>Rabbit: Publish offer result
      Rabbit->>Supply: Update available offer
    end
  end
```

The refresh frequency determines `next_refresh_at`. A successful refresh only
publishes back to Java when the persisted valid offer's price or package size
changed.

## Dynamic View - Activity Rate Configuration

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Controller as ActivityRateController
  participant Service as ActivityRateService
  participant Repository as ActivityRateRepositoryPort
  participant Bom as BOM pricing

  Admin->>Controller: Create or update hourly rate
  Controller->>Service: Validate ActivityType and Money
  Service->>Repository: Save one rate per ActivityType
  Repository-->>Service: Persisted ActivityRate
  Service-->>Controller: ActivityRate
  Controller-->>Admin: Activity rate response
  Bom->>Repository: Load rates during cost calculation
```

Activities store their type and duration. They do not copy the hourly rate;
changing a configured rate affects subsequent BOM cost calculations.

## Dynamic View - Catalog Product Management

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Catalog as CatalogController
  participant Product as ProductService
  participant Category as ProductCategoryRepository
  participant BomPort as BomPricingPort
  participant Repository as ProductRepository

  Admin->>Catalog: Create or update product
  Catalog->>Product: Product aggregate
  Product->>Category: Verify category UUID
  loop each common ProductBom
    Product->>BomPort: exists(bomId)
    BomPort-->>Product: BOM existence
  end
  Product->>Repository: Reconcile and persist aggregate
  Repository-->>Product: Persisted aggregate
  Product-->>Catalog: Product UUID or updated product
  Catalog-->>Admin: HTTP response
```

Unknown common Product BOMs reject create/update. Choice and ingredient BOM
references remain optional so an incomplete cost model does not block product
management or sale.

## Dynamic View - Catalog Pricing

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Catalog as Catalog use cases
  participant BomPort as BomPricingPort
  participant Bom as BOM public API
  participant Supply as Supply pricing adapter

  Admin->>Catalog: Request pricing analysis
  Catalog->>Catalog: Validate selected configuration
  loop productBoms, choice BOMs, extra BOMs
    Catalog->>BomPort: getPricing(bomId)
    BomPort->>Bom: getBomPricing(bomId)
    Bom->>Supply: Resolve component prices
    Supply-->>Bom: Component costs
    Bom-->>BomPort: BOM total cost and yield
    BomPort-->>Catalog: Unit cost inputs
  end
  Catalog->>Catalog: Calculate cost, margin, status, recommendation
  Catalog-->>Admin: Pricing analysis
```

Pricing analysis never changes sale prices. It returns margin health and a
recommended price for human review.

## Dynamic View - Catalog Publication

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin or scheduler
  participant Catalog as CatalogPublicationService
  participant ProductRepo as ProductRepository
  participant CategoryRepo as ProductCategoryRepository
  participant Mapper as PublishedCatalogProductMapper
  participant Supabase as PublishedCatalogPort / Supabase
  participant Public as Savouretplus

  Admin->>Catalog: publishAll()
  Catalog->>ProductRepo: findAllPublished()
  loop each published product
    Catalog->>CategoryRepo: find category
    Catalog->>Mapper: map product to public projection
    Mapper-->>Catalog: PublishedCatalogProduct
    Catalog->>Supabase: upsert published_catalog_products
  end
  Public->>Supabase: read public catalog
```

The public projection excludes common `productBoms`, internal costs,
target-margin data, diagnostics, and recommended prices. Choice and ingredient
`bom_id` values may be present because the customer configuration can require
them.

## Dynamic View - Executor Retry and Scheduling

```mermaid
sequenceDiagram
  participant Beat as Celery Beat
  participant Rabbit as RabbitMQ
  participant Worker as Celery worker
  participant TaskRepo as SavisTaskRepository
  participant Offers as OffersUseCase
  participant Provider as Provider website

  Beat->>Rabbit: schedule due refresh / cleanup
  Rabbit->>Worker: deliver task
  Worker->>Offers: execute provider work
  Offers->>Provider: scrape or refresh
  alt success
    Worker->>TaskRepo: mark completed
  else repeated failure
    Worker->>Worker: retry with backoff
    Worker->>TaskRepo: mark failed after max retries
  end
```

RabbitMQ subscriber callbacks use `basic_ack` only after enqueueing succeeds.
Malformed or unprocessable messages currently use `basic_nack(requeue=false)`;
a dead-letter queue is a future hardening step.

## Persistence Ownership

```mermaid
flowchart LR
  Api["Container<br/>SAVIS API"] --> PgApi[("Container<br/>PostgreSQL savis_api")]
  Executor["Container<br/>SAVIS Executor"] --> PgExecutor[("Container<br/>PostgreSQL savis_executor")]
  Api --> Supabase[("External System<br/>Supabase public schema")]

  PgApi --> ApiTables["BOMs<br/>Supply offers<br/>Catalog products<br/>Activity rates"]
  PgExecutor --> ExecutorTables["Executor tasks<br/>Tracked offers"]
  Supabase --> PublicTables["published_catalog_products<br/>customer_orders<br/>quote_requests"]
```

- Java-owned schema changes currently use `spring.jpa.hibernate.ddl-auto=update`.
- Java tests use H2 in PostgreSQL compatibility mode with `ddl-auto=create-drop`.
- Executor schema is created by SQLAlchemy at runtime.
- Supabase schema is managed by SQL migrations under `supabase/migrations`.
- BOM references across Catalog remain UUID values, not JPA foreign keys to BOM
  entities.

## Code Organization

### Java API

```text
com.savouretplus.savis
  bom/
    api/
    domain/
    usecase/
    port/
    adapter/
    config/
  supply/
    api/
    domain/
    usecase/
    port/
    adapter/
    config/
  catalog/
    domain/
    usecase/
    port/
    adapter/
    config/
  common/
```

### Executor

```text
app/
  core/
    models.py
    ports.py
    use_case_offers.py
    use_case_savis_tasks.py
  adapters/
    api/
    celery/
    database/
    rabbitmq/
    scrapers/
  container.py
```

### Admin

```text
src/
  app/
  features/
    activity-rate/
    bom/
    bom-component/
      task/
    catalog/
    dashboard/
  shared/
```

## Architectural Rules

- Keep domain/core models framework-independent.
- Keep cross-module dependencies explicit through ports or public APIs.
- Keep provider scraping isolated behind executor `OfferProvider` adapters.
- Keep Java as owner of business state.
- Keep Python as owner of acquisition execution and task state.
- Keep Supabase as a projection, not the source of truth.
- Do not run provider collection synchronously in request handlers or RabbitMQ
  callbacks.
- Keep result consumers idempotent because messages may be retried or replayed.
- Do not introduce Catalog-to-BOM JPA relationships.
- Treat pricing recommendations as advisory; never auto-update sale prices.
