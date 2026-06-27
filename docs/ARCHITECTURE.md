# SAVIS Architecture

This document describes the current architecture of SAVIS using C4-style
system, container, component, and dynamic views.

It focuses on ownership, dependencies, runtime behavior, persistence, and
delivery. Setup instructions and feature details belong in the
[root README](../README.md) and module documentation.

## Navigation

- [Scope](#scope)
- [Architectural Drivers](#architectural-drivers)
- [Architecture Used in SAVIS](#architecture-used-in-savis)
- [System Context](#system-context)
- [Container View](#container-view)
- [Production Topology](#production-topology)
- [API Components](#api-components)
- [Executor Components](#executor-components)
- [Admin Components](#admin-components)
- [Runtime Flows](#runtime-flows)
- [Data Ownership](#data-ownership)
- [Messaging](#messaging)
- [Operational Characteristics](#operational-characteristics)
- [Delivery Architecture](#delivery-architecture)
- [Architectural Rules](#architectural-rules)
- [Known Constraints](#known-constraints)

## Scope

SAVIS is the internal back-office system for SavouretPlus. It currently owns:

- technical BOMs, components, activities, yields, and costs;
- provider offer acquisition and review;
- global activity rates;
- sellable catalog products and configuration rules;
- product cost and margin analysis;
- publication of a limited customer-facing catalog projection.

The public SavouretPlus application and Supabase commerce tables are outside
the SAVIS system boundary. SAVIS publishes catalog data to Supabase but does
not use Supabase as its business database.

Orders, inventory, purchasing, catering operations, and decoration operations
are not yet SAVIS business slices.

### Diagram Conventions

The diagrams use Mermaid for rendering in GitHub. C4 Level 4 code diagrams are
intentionally omitted because package and class details are better represented
by source code and automated module tests.

## Architectural Drivers

1. **Clear ownership**

   Java owns business state. Python owns acquisition execution and provider
   state. Supabase owns only the public projection and customer submissions.

2. **Asynchronous provider access**

   Scraping is slow, externally constrained, and failure-prone. HTTP handlers
   and RabbitMQ callbacks persist and enqueue work instead of performing it.

3. **Persistent browser identity**

   Google Chrome runs outside Docker and Celery so its profile, cookies, local
   storage, and browser identity survive task and container restarts.

4. **Explicit module boundaries**

   Business slices communicate through public APIs and ports. Catalog never
   accesses BOM entities or repositories directly.

5. **Independent schema evolution**

   The API, Executor, and Supabase each own their migrations and persistence
   lifecycle.

6. **Operationally verifiable releases**

   Production uses immutable image digests, ordered migrations, dependency
   health checks, and a checksummed release package.

## Architecture Used in SAVIS

SAVIS is built as a modular monolith plus a separate acquisition executor.
The API keeps business modules in one deployable Spring Boot application, while
the Executor isolates provider access, browser automation, and Celery work.

The main architectural patterns used are:

| Pattern                                      | Where it appears                                                                                                                                             | Purpose                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Modular monolith                             | SAVIS API modules: BOM, Supply, Catalog, Common                                                                                                              | Keep business slices independently understandable while sharing one JVM, one deployment unit, and in-process module calls.                                                     |
| Spring Modulith module verification          | `SavisApiModularityTests` and named interfaces                                                                                                               | Enforce allowed module dependencies and document the module graph.                                                                                                             |
| Hexagonal architecture / ports and adapters  | API use cases depend on repository, pricing, publication, and messaging ports; Executor use cases depend on repository, queue, publisher, and provider ports | Keep domain/use-case code independent from HTTP, JPA, RabbitMQ, Supabase, provider HTML, and browser automation details.                                                       |
| Domain-driven tactical patterns              | Aggregates such as BOM and catalog Product; value objects such as Money, Quantity, Unit                                                                      | Put business invariants and calculations close to the model that owns them.                                                                                                    |
| Repository pattern                           | JPA repositories in the API and SQLAlchemy repositories in the Executor                                                                                      | Hide persistence mechanics behind module-specific persistence adapters.                                                                                                        |
| Application service / use-case orchestration | `BomService`, `OfferService`, catalog services, Executor use cases                                                                                           | Coordinate validation, persistence, pricing, messaging, and external ports without pushing workflow into controllers.                                                          |
| Adapter pattern                              | Web controllers, RabbitMQ listeners/publishers, Supabase adapter, provider adapters                                                                          | Isolate protocol-specific and vendor-specific code at the edges.                                                                                                               |
| Facade / public module API                   | `BomPricingApi`, `SupplyApi`                                                                                                                                 | Allow one module to consume another module's capability without depending on its entities or repositories.                                                                     |
| Event-driven integration                     | RabbitMQ offer request, result, and invalidation messages                                                                                                    | Decouple the API from slower provider acquisition and allow asynchronous processing.                                                                                           |
| Outbox pattern                               | Spring Modulith event publication table `event_publication` for API events externalized to RabbitMQ                                                          | Persist event publication state with the API transaction so outbound integration messages are traceable and retryable instead of being fire-and-forget `RabbitTemplate` sends. |
| Declarative event externalization            | `@Externalized` on `ComponentNeededEvent` and Modulith AMQP externalization                                                                                  | Declare which application events leave the module boundary and map domain events to RabbitMQ contracts in one place.                                                           |
| Message contract mapping                     | `ComponentNeededEvent` maps to the RabbitMQ payload `{content,type}`                                                                                         | Preserve external wire compatibility while allowing the Java domain event to keep domain-oriented names.                                                                       |
| Durable broker topology                      | Durable RabbitMQ queues, direct exchange, and queue bindings                                                                                                 | Keep broker routes stable across restarts and avoid coupling publishers directly to queue declaration details.                                                                 |
| Task queue / worker pattern                  | Celery tasks and RabbitMQ delivery in the Executor                                                                                                           | Run slow browser/provider operations outside request and subscriber callbacks.                                                                                                 |
| Scheduled jobs                               | Celery Beat executor workflows                                                                                                                               | Run refresh and cleanup workflows on explicit schedules.                                                                                                                       |
| Circuit breaker / provider protection        | Executor provider access policy cooldowns                                                                                                                    | Reduce repeated requests when a provider blocks or becomes unhealthy.                                                                                                          |
| Retry with backoff and stale cleanup         | Celery retry policy, hard task limits, and scheduled stale task cleanup                                                                                      | Recover from transient failures while making stuck work visible and terminal.                                                                                                  |
| Read model / projection                      | API Supply offer projection and Supabase published catalog projection                                                                                        | Store query-friendly views owned by the consumer boundary rather than sharing internal aggregates.                                                                             |
| Health check and readiness gates             | API, Executor, RabbitMQ, PostgreSQL, Chrome relay, deployment script                                                                                         | Promote releases only after dependencies and application components are operational.                                                                                           |

These patterns are intentionally not applied uniformly everywhere. The system
uses the heavier event/outbox path where cross-process messaging must be
transactionally traceable, and keeps direct in-process APIs for synchronous
module calls such as catalog pricing.

## System Context

### C4 Level 1

```mermaid
flowchart LR
  Operator["Person<br/>Internal SAVIS operator"]
  Customer["Person<br/>Customer"]
  SAVIS["Software System<br/>SAVIS<br/>Back-office management and pricing"]
  Providers["External Systems<br/>Provider websites"]
  Storefront["External System<br/>SavouretPlus storefront"]
  Supabase["External System<br/>Supabase public projection"]

  Operator -->|manages BOMs, offers, rates, and catalog| SAVIS
  SAVIS -->|collects and refreshes offers| Providers
  SAVIS -->|publishes catalog products| Supabase
  Storefront -->|reads catalog and submits requests| Supabase
  Customer -->|shops and requests quotes| Storefront
```

### System Boundaries

| System            | Owns                                                                | Does not own                                     |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| SAVIS             | Internal business state, provider acquisition, pricing, publication | Public storefront sessions and customer identity |
| Provider websites | Product pages, prices, availability, anti-automation behavior       | SAVIS offer review state                         |
| Supabase          | Public projection, customer orders, quote requests, RLS             | BOMs, internal costs, provider tasks             |
| SavouretPlus      | Customer-facing experience                                          | SAVIS business rules                             |

Provider-specific HTML and navigation behavior must remain inside Executor
adapters and must not leak into Java domain models.

## Container View

### C4 Level 2

```mermaid
flowchart LR
  subgraph SAVIS["Software System: SAVIS"]
    Admin["Container<br/>SAVIS Admin<br/>React and Nginx"]
    Api["Container<br/>SAVIS API<br/>Spring Boot"]
    ExecutorApi["Container<br/>Executor API<br/>FastAPI and Rabbit subscriber"]
    Worker["Container<br/>Executor Worker<br/>Celery and Playwright"]
    Beat["Container<br/>Executor Beat<br/>Periodic scheduler"]
    Migrate["Container<br/>Executor Migrate<br/>One-shot Alembic process"]
    Rabbit[("Container<br/>RabbitMQ")]
    Postgres[("Container<br/>PostgreSQL")]
    ChromeRelay["Host Service<br/>socat CDP relay :9223"]
    Chrome["Host Process<br/>Google Chrome :9222<br/>Persistent profile"]
  end

  Providers["External Systems<br/>Provider websites"]
  Supabase[("External System<br/>Supabase")]
  Storefront["External System<br/>SavouretPlus"]

  Admin -->|HTTP /api| Api
  Admin -->|HTTP /executor-api| ExecutorApi

  Api -->|JPA / schema savis_api| Postgres
  ExecutorApi -->|SQLAlchemy / schema savis_executor| Postgres
  Worker -->|SQLAlchemy / schema savis_executor| Postgres
  Migrate -->|Alembic migrations| Postgres

  Api -->|offer requests| Rabbit
  Rabbit -->|offer results and invalidations| Api
  ExecutorApi -->|Celery tasks| Rabbit
  Rabbit -->|Celery tasks| Worker
  Rabbit -->|offer requests| ExecutorApi
  Beat -->|scheduled Celery tasks| Rabbit
  Worker -->|offer results and invalidations| Rabbit

  Worker -->|Playwright over CDP| ChromeRelay
  ChromeRelay -->|TCP relay| Chrome
  Chrome -->|HTTPS navigation| Providers

  Api -->|Supabase REST publication| Supabase
  Storefront -->|public catalog and submissions| Supabase
```

### Container Responsibilities

| Container or process | Responsibility                                         | State                   |
| -------------------- | ------------------------------------------------------ | ----------------------- |
| `frontend_admin`     | Serves the SPA and proxies API traffic                 | Browser state only      |
| `backend_api`        | Runs BOM, Supply, Activity Rate, and Catalog workflows | `savis_api` schema      |
| `executor_api`       | Exposes offers/tasks and subscribes to offer requests  | `savis_executor` schema |
| `executor_worker`    | Executes slow provider collection and refresh          | `savis_executor` schema |
| `executor_beat`      | Schedules due refreshes and stale-task cleanup         | Celery schedule state   |
| `executor_migrate`   | Applies forward-only Executor migrations               | Alembic version table   |
| `postgres`           | Hosts independently owned API and Executor schemas     | Docker volume           |
| `rabbitmq`           | Carries integration messages and Celery tasks          | Durable broker data     |
| Google Chrome        | Maintains the provider-facing browser identity         | Host profile directory  |
| CDP relay            | Makes loopback Chrome CDP reachable from Docker        | None                    |

## Production Topology

```mermaid
flowchart TB
  User["Internal browser"]

  subgraph Host["Ubuntu production host"]
    Admin["frontend_admin<br/>Nginx :8080"]
    Api["backend_api<br/>Spring Boot :8080"]
    ExecutorApi["executor_api<br/>FastAPI :8000"]
    Worker["executor_worker"]
    Beat["executor_beat"]
    Postgres[("postgres")]
    Rabbit[("rabbitmq")]
    Chrome["Google Chrome<br/>systemd user service :9222"]
    Relay["socat relay<br/>systemd user service :9223"]
  end

  User -->|"SAVIS_HTTP_BIND:SAVIS_HTTP_PORT<br/>default 127.0.0.1:8088"| Admin
  Admin -->|private Docker network| Api
  Admin -->|private Docker network| ExecutorApi
  Api --> Postgres
  ExecutorApi --> Postgres
  Worker --> Postgres
  Api <--> Rabbit
  ExecutorApi <--> Rabbit
  Worker <--> Rabbit
  Beat --> Rabbit
  Worker -->|host.docker.internal:9223| Relay
  Relay --> Chrome
```

Only the Admin port is published by `docker-compose.prod.yml`. API, Executor,
PostgreSQL, and RabbitMQ remain on the private backend network.

The Admin Nginx container is the production entry point:

- `/` serves the React single-page application;
- `/api/*` proxies to `backend_api`;
- `/executor-api/*` proxies to `executor_api`;
- `/health` provides a container health endpoint.

Chrome and its relay are user-level `systemd` services owned by the graphical
desktop user. They deliberately outlive Docker deployments.

## API Components

### C4 Level 3

```mermaid
flowchart TB
  subgraph Api["SAVIS API"]
    subgraph Bom["BOM module"]
      BomWeb["Web adapters<br/>BomController<br/>ActivityRateController"]
      BomUse["Use cases<br/>BomService<br/>ActivityRateService"]
      BomDomain["Domain<br/>Bom, Component, Activity<br/>Yield, ActivityRate"]
      BomPorts["Ports and public API<br/>Repositories<br/>ComponentPricePort<br/>ComponentNeededEventPort<br/>BomPricingApi"]
      BomAdapters["Adapters<br/>JPA<br/>Modulith event publisher<br/>Supply pricing"]
    end

    subgraph Supply["Supply module"]
      SupplyWeb["Web adapter<br/>SupplyOfferController"]
      SupplyUse["Use case<br/>OfferService"]
      SupplyDomain["Domain<br/>Offer, Provider"]
      SupplyApi["Public API<br/>SupplyApi"]
      SupplyAdapters["Adapters<br/>JPA<br/>RabbitMQ listeners"]
    end

    subgraph Catalog["Catalog module"]
      CatalogWeb["Web adapters<br/>CatalogController"]
      CatalogUse["Use cases<br/>Product services<br/>Cost, pricing, publication"]
      CatalogDomain["Domain<br/>Product aggregate<br/>ProductBom, modes<br/>choices, ingredients"]
      CatalogPorts["Ports<br/>Repositories<br/>BomPricingPort<br/>PublishedCatalogPort"]
      CatalogAdapters["Adapters<br/>JPA<br/>BOM public API<br/>Supabase"]
    end

    Common["Shared value objects<br/>Money, Quantity, Unit"]
  end

  BomWeb --> BomUse --> BomDomain
  BomUse --> BomPorts --> BomAdapters

  SupplyWeb --> SupplyUse --> SupplyDomain
  SupplyUse --> SupplyApi
  SupplyUse --> SupplyAdapters

  CatalogWeb --> CatalogUse --> CatalogDomain
  CatalogUse --> CatalogPorts --> CatalogAdapters

  BomAdapters -->|SupplyApi| SupplyUse
  CatalogAdapters -->|BomPricingApi| BomUse

  BomDomain --> Common
  SupplyDomain --> Common
  CatalogDomain --> Common
```

### Module Boundaries

- BOM consumes offer prices through `SupplyApi`.
- Catalog consumes BOM cost and yield through `BomPricingApi`.
- Catalog stores BOM UUID values, not JPA relationships to BOM entities.
- `common` contains shared value objects, not workflow orchestration.
- HTTP, JPA, RabbitMQ, and Supabase dependencies remain in adapters.

`SavisApiModularityTests` uses Spring Modulith to verify module dependencies and
generate module documentation snippets.

### Pricing Boundary

```text
Catalog use case
  -> BomPricingPort
  -> BomPricingAdapter
  -> BomPricingApi
  -> BomService
  -> ComponentPricePort
  -> ComponentPriceAdapter
  -> SupplyApi
```

This path keeps Catalog independent from BOM and Supply persistence while still
allowing synchronous in-process pricing.

## Executor Components

### C4 Level 3

```mermaid
flowchart TB
  subgraph Executor["SAVIS Executor"]
    Routes["FastAPI adapters<br/>offers, tasks, health"]
    Subscriber["RabbitMQ subscriber<br/>savis.offer.requests"]
    CeleryTasks["Celery task adapters"]
    Beat["Celery Beat schedule"]
    Container["Composition root<br/>Container and Celery wiring"]

    subgraph Core["Core"]
      Models["Models<br/>Offer, SavisTask<br/>Provider, Price"]
      Offers["OffersUseCase"]
      Tasks["SavisTaskUseCase"]
      Ports["Ports<br/>repositories, queue<br/>publisher, providers"]
    end

    subgraph Adapters["Adapters"]
      Database["SQLAlchemy repositories<br/>provider access policy"]
      Queue["CeleryQueue"]
      Publisher["RabbitMQ publisher"]
      Providers["Provider adapters<br/>Maxi"]
      Browser["BrowserManager<br/>external Chrome CDP"]
    end
  end

  Routes --> Container
  Subscriber --> Container
  CeleryTasks --> Container
  Beat --> CeleryTasks
  Container --> Offers
  Container --> Tasks
  Offers --> Models
  Tasks --> Models
  Offers --> Ports
  Tasks --> Ports
  Ports --> Database
  Ports --> Queue
  Ports --> Publisher
  Ports --> Providers
  Providers --> Browser
```

### Execution Rules

- Core models and use cases are provider-neutral.
- API routes and subscriber callbacks validate, persist, and enqueue.
- The worker performs browser navigation.
- One worker process with concurrency `1` controls the shared Chrome profile.
- `BrowserManager` opens one page per operation and disconnects without
  terminating Chrome.
- Provider adapters own selectors, parsing, block detection, and normalized
  offer conversion.
- `ReportingTask` records final Celery failures in SAVIS task persistence.

### Failure Classification

| Failure                        | Celery behavior                                             |
| ------------------------------ | ----------------------------------------------------------- |
| Unexpected transient exception | Retry with backoff, maximum 3 retries                       |
| Provider block or open circuit | Fail without immediate retry                                |
| Chrome CDP unavailable         | Fail without immediate retry                                |
| 30-minute task limit reached   | Worker terminates the task; stale cleanup provides recovery |

Immediate retries are avoided when the provider or browser state cannot improve
within the same task attempt.

## Admin Components

### C4 Level 3

```mermaid
flowchart TB
  subgraph Admin["SAVIS Admin"]
    Router["AppRouter"]
    Layout["MainLayout<br/>sidebar, header, breadcrumbs"]
    ApiClients["Shared Axios clients<br/>api and executorApi"]
    SharedUi["Shared UI<br/>shadcn and application components"]

    subgraph Features["Business features"]
      Dashboard["dashboard"]
      Bom["bom"]
      Components["bom-component"]
      Tasks["bom-component/task"]
      Rates["activity-rate"]
      Catalog["catalog"]
    end
  end

  Router --> Layout
  Router --> Dashboard
  Router --> Bom
  Router --> Components
  Components --> Tasks
  Router --> Rates
  Router --> Catalog

  Bom --> ApiClients
  Components --> ApiClients
  Tasks --> ApiClients
  Rates --> ApiClients
  Catalog --> ApiClients

  Bom --> SharedUi
  Components --> SharedUi
  Rates --> SharedUi
  Catalog --> SharedUi
```

| Client        | Default production path | Target         |
| ------------- | ----------------------- | -------------- |
| `api`         | `/api`                  | SAVIS API      |
| `executorApi` | `/executor-api`         | SAVIS Executor |

The dashboard currently demonstrates the application shell with static data.
It is not yet an operational read model.

## Runtime Flows

### Activity Rate Configuration

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Controller as ActivityRateController
  participant Service as ActivityRateService
  participant Repository as ActivityRateRepositoryPort
  participant Bom as BomService pricing

  Admin->>Controller: GET /api/activity-rates
  Controller->>Service: listActivityRates()
  Service->>Repository: findAll()
  Repository-->>Service: Configured rates
  Service-->>Controller: Activity rates
  Controller-->>Admin: HTTP response

  alt create an unconfigured activity type
    Admin->>Controller: POST activity type and hourly Money
    Controller->>Service: createActivityRate()
    Service->>Repository: Ensure type does not exist
    Service->>Repository: Save ActivityRate
  else update a configured activity type
    Admin->>Controller: PUT /{activityType}
    Controller->>Service: updateActivityRate()
    Service->>Repository: Load existing rate
    Service->>Repository: Save replacement Money
  else delete a configured activity type
    Admin->>Controller: DELETE /{activityType}
    Controller->>Service: deleteActivityRate()
    Service->>Repository: Verify and delete rate
  end

  Admin->>Bom: Request BOM price
  Bom->>Repository: Load current rates by ActivityType
  Bom->>Bom: minutes / 60 * hourly rate
  Bom-->>Admin: Recalculated BOM cost
```

Activities store only their type and duration. Rates are global and are read
when a BOM is priced, so a configuration change affects subsequent
calculations without modifying existing BOM activities. A missing rate
currently contributes zero.

### Manual Offer Retrieval

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Executor as Executor API
  participant Tasks as SavisTaskUseCase
  participant PgExec as savis_executor
  participant Rabbit as RabbitMQ
  participant Worker as Celery worker
  participant Offers as OffersUseCase
  participant Provider as Selected provider adapter

  Admin->>Executor: POST /tasks<br/>GET_OFFER(provider, URL, search term, type)
  Executor->>Tasks: enqueue_savis_task(payload)
  Tasks->>PgExec: Persist IN_PROGRESS task
  Tasks->>Rabbit: Enqueue get_offer_task
  Rabbit->>Worker: Deliver task
  Worker->>Tasks: execute_savis_task()
  Tasks->>Offers: get_offer(URL, provider)
  Offers->>Provider: Retrieve exact product URL
  Provider-->>Offers: Normalized offer or no result
  Offers->>PgExec: Create NEW or reconcile existing offer
  Tasks->>PgExec: Mark task COMPLETED
  Admin->>Executor: GET /tasks and GET /offers
  Executor-->>Admin: Task status and retrieved offer
```

Manual retrieval targets one exact provider URL and does not run the
all-provider coverage check used by automatic `GET_OFFERS` collection. Queueing
failure marks the persisted task failed; execution failures follow the retry
flow described below.

Manual retrieval is the preferred acquisition path when the operator knows the
exact provider product URL. It is more precise and avoids broad provider search
results.

### BOM Creation and Automatic Offer Collection

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Bom as API BOM module
  participant Outbox as Modulith event_publication
  participant Rabbit as RabbitMQ
  participant Executor as Executor subscriber
  participant PgExec as savis_executor
  participant Worker as Celery worker
  participant Provider as Provider website
  participant Supply as API Supply module

  Admin->>Bom: Save BOM
  Bom->>Bom: Persist aggregate
  loop each component
    Bom->>Outbox: Publish ComponentNeededEvent
    Outbox->>Rabbit: Externalize ComponentNeededMessage
  end
  Rabbit->>Executor: savis.offer.requests
  Executor->>PgExec: Persist GET_OFFERS task
  Executor->>Rabbit: Enqueue Celery task
  Rabbit->>Worker: Deliver task
  Worker->>Provider: Search through Chrome CDP
  Worker->>PgExec: Reconcile NEW offers
  Worker->>PgExec: Mark task COMPLETED
  Admin->>Executor: Review offer
  Admin->>Executor: Mark offer VALID
  Executor->>Rabbit: savis.offer.results
  Rabbit->>Supply: Upsert available offer
```

Automatic collection is a secondary coverage mechanism for BOM components
without a known product URL. It is skipped when all configured providers
already have offers for the requested search term and type.

### Review, Invalidate, and Delete an Offer

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Executor as Executor API
  participant PgExec as savis_executor
  participant Rabbit as RabbitMQ
  participant Supply as API Supply module

  Admin->>Executor: PATCH offer status
  Executor->>PgExec: Persist review state
  alt transition to VALID
    Executor->>Rabbit: Publish offer result
    Rabbit->>Supply: Upsert available projection
  else VALID to REJECTED
    Executor->>Rabbit: Publish invalidation
    Rabbit->>Supply: Mark projection unavailable
  else delete VALID offer
    Executor->>Rabbit: Publish invalidation
    Executor->>PgExec: Delete offer
    Rabbit->>Supply: Mark projection unavailable
  end
```

The Executor owns review history and refresh settings. The API stores only the
available offer projection required by BOM pricing.

### Scheduled Refresh and Provider Protection

```mermaid
sequenceDiagram
  participant Beat as Celery Beat
  participant Rabbit as RabbitMQ
  participant Worker as Celery worker
  participant Policy as Provider access policy
  participant PgExec as savis_executor
  participant Chrome as External Chrome
  participant Supply as API Supply module

  Beat->>Rabbit: schedule_due_offer_refresh_tasks (hourly)
  Rabbit->>Worker: Scheduler task
  Worker->>PgExec: Find VALID offers due
  loop each due offer
    Worker->>PgExec: Persist REFRESH_OFFER task
    Worker->>Rabbit: Enqueue refresh task
    Rabbit->>Worker: Deliver refresh task
    Worker->>Policy: Reserve provider request slot
    Policy->>PgExec: Lock/update provider access state
    Worker->>Chrome: Refresh provider page
    alt provider block
      Worker->>Policy: Open progressive cooldown
      Worker->>PgExec: Mark task FAILED
    else changed valid offer
      Worker->>PgExec: Save refreshed offer
      Worker->>Rabbit: Publish offer result
      Rabbit->>Supply: Update available projection
    else unchanged offer
      Worker->>PgExec: Save observation and complete task
    end
  end
```

Navigation starts are spaced between 1 and 10 minutes by default. Consecutive
blocks open the circuit for 15 minutes, 1 hour, 6 hours, then 24 hours. After a
cooldown, one recovery probe is reserved.

Celery Beat also marks tasks still `IN_PROGRESS` after two hours as failed. The
cleanup runs every 15 minutes.

### Executor Retry and Scheduling

```mermaid
sequenceDiagram
  participant Beat as Celery Beat
  participant Rabbit as RabbitMQ
  participant Worker as Celery worker
  participant Task as ReportingTask
  participant Tasks as SavisTaskUseCase
  participant Offers as OffersUseCase
  participant Provider as Provider or Chrome
  participant PgExec as savis_executor

  par hourly refresh scheduling
    Beat->>Rabbit: schedule_due_offer_refresh_tasks
  and stale cleanup every 15 minutes
    Beat->>Rabbit: cleanup_stale_savis_tasks
  end

  Rabbit->>Worker: Deliver Celery task
  Worker->>Tasks: Execute persisted SAVIS task
  Tasks->>Offers: Collect or refresh offer
  Offers->>Provider: Provider operation

  alt success
    Offers-->>Tasks: Result
    Tasks->>PgExec: Mark COMPLETED
  else provider block, open circuit, or Chrome unavailable
    Provider-->>Worker: OfferProviderNonRetryableError
    Worker->>Task: on_failure without automatic retry
    Task->>PgExec: Mark FAILED
  else unexpected transient failure
    Provider-->>Worker: Exception
    Worker->>Rabbit: Retry with backoff
    alt a retry succeeds
      Rabbit->>Worker: Redeliver task
      Worker->>PgExec: Mark COMPLETED
    else 3 retries exhausted
      Worker->>Task: on_failure
      Task->>PgExec: Mark FAILED
    end
  end

  Rabbit->>Worker: Deliver scheduled stale cleanup
  Worker->>Tasks: mark_stale_tasks_failed()
  Tasks->>PgExec: Mark tasks older than 2 hours FAILED
```

Celery enforces a 30-minute hard task limit, worker prefetch `1`, concurrency
`1`, and at most 10 tasks per child process. Retry policy and stale cleanup are
complementary: retries handle transient execution failures, while cleanup
recovers persisted tasks whose worker never reported a terminal state.

### Catalog Product Management

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Controller as CatalogController
  participant Products as ProductService
  participant BomPort as BomPricingPort
  participant Repository as ProductRepository

  Admin->>Controller: Create or update product aggregate
  Controller->>Products: Product with modes, BOMs, choices, ingredients
  Products->>Products: Validate product structure and invariants
  loop each common ProductBom
    Products->>BomPort: exists(bomId)
    BomPort-->>Products: BOM existence
  end
  alt common BOM is unknown
    Products-->>Controller: Reject command
    Controller-->>Admin: Problem Details response
  else aggregate is valid
    Products->>Repository: Reconcile child collections and persist
    Repository-->>Products: Persisted product
    Products-->>Controller: Product result
    Controller-->>Admin: HTTP success
  end
```

Common `ProductBom` references must resolve when a product is saved. Choice and
ingredient BOM references remain optional; unresolved optional references make
pricing analysis incomplete rather than blocking product management.

### Catalog Pricing

```mermaid
sequenceDiagram
  participant Admin as SAVIS Admin
  participant Catalog as API Catalog module
  participant Bom as BomPricingApi
  participant Supply as SupplyApi

  Admin->>Catalog: Request pricing analysis
  loop common, choice, and ingredient BOM references
    Catalog->>Bom: Get BOM cost and yield
    Bom->>Supply: Resolve component offer prices
    Supply-->>Bom: Selected or cheapest compatible offers
    Bom-->>Catalog: Total cost and yield
  end
  Catalog-->>Admin: Cost, margin, health, recommendation
```

Pricing recommendations are advisory and never mutate sale prices. Missing or
non-calculable BOM references produce an `INCOMPLETE` result.

### Catalog Publication

```mermaid
sequenceDiagram
  participant Trigger as SAVIS Admin or Spring scheduler
  participant Controller as CatalogController
  participant Publication as CatalogPublicationService
  participant Products as ProductRepository
  participant Mapper as PublishedCatalogProductMapper
  participant Port as PublishedCatalogPort
  participant Supabase as Supabase
  participant Storefront as SavouretPlus

  alt bulk publication
    Trigger->>Controller: POST /api/catalog/products/publish
    Controller->>Publication: publishAll()
  else single product publication
    Trigger->>Controller: POST /api/catalog/products/{productId}/publish
    Controller->>Publication: publish(productId)
  else single product removal
    Trigger->>Controller: POST /api/catalog/products/{productId}/unpublish
    Controller->>Publication: unpublish(productId)
  end

  alt Supabase publication is disabled
    Publication-->>Trigger: Reject request
  else publication is enabled
    Publication->>Products: findAllPublished()
    loop each published product
      Publication->>Mapper: Map internal aggregate
      Mapper-->>Publication: PublishedCatalogProduct
      Publication->>Port: publish(public projection)
      Port->>Supabase: Upsert published_catalog_products
    end
    Publication-->>Trigger: Published product count
  end

  Storefront->>Supabase: Read published catalog
```

The public projection excludes common `productBoms`, internal costs,
target-margin data, diagnostics, and recommended prices. Publishing one product
that is no longer marked `published` removes its public projection. The current
HTTP endpoint calls only bulk publication, which processes products still
marked for publication and therefore does not reconcile newly unpublished
records by itself.

### Flow Review Checklist

| Flow                       | Questions for the next iteration                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| Activity rates             | Should rate changes be versioned or effective-dated for historical cost reproducibility?       |
| Manual offer retrieval     | Should operators be able to cancel, retry, or resume a failed task from the Admin?             |
| Automatic offer collection | Should duplicate component events have an explicit idempotency key or acquisition window?      |
| Offer review               | Should review transitions record the operator, reason, and audit timestamp?                    |
| Scheduled refresh          | Should per-provider schedules and concurrency limits be configurable independently?            |
| Retry and scheduling       | Should failed integration messages use a dead-letter queue and an operator replay workflow?    |
| Product management         | Should optional choice and ingredient BOMs be validated earlier with non-blocking diagnostics? |
| Catalog pricing            | Should stored pricing snapshots preserve the assumptions used for a recommendation?            |
| Catalog publication        | Should bulk publication reconcile deletions and newly unpublished products in Supabase?        |

## Data Ownership

```mermaid
flowchart LR
  Api["SAVIS API"] --> ApiSchema[("savis_api")]
  Executor["SAVIS Executor"] --> ExecutorSchema[("savis_executor")]
  Api --> PublicSchema[("Supabase public schema")]

  ApiSchema --> ApiData["BOMs and activities<br/>activity rates<br/>available offers<br/>catalog aggregates"]
  ExecutorSchema --> ExecutorData["tasks<br/>reviewed offers<br/>provider access state"]
  PublicSchema --> PublicData["published catalog<br/>customer orders<br/>quote requests"]
```

| Owner          | Migration mechanism                                      | Runtime policy                      |
| -------------- | -------------------------------------------------------- | ----------------------------------- |
| SAVIS API      | Flyway under `savis-api/src/main/resources/db/migration` | Hibernate `ddl-auto=validate`       |
| SAVIS Executor | Alembic under `savis-executor/alembic/versions`          | Explicit `executor_migrate` process |
| Supabase       | SQL under `supabase/migrations`                          | Applied by Supabase CLI             |

API tests use H2 in PostgreSQL compatibility mode with
`ddl-auto=create-drop`; Flyway is disabled in that test profile.

Executor downgrades are intentionally unsupported. Production migrations are
forward-only.

### Cross-Boundary Identifiers

- Public UUIDs cross HTTP, messaging, and module boundaries.
- Internal database identity columns remain private to their owning schema.
- Catalog BOM references are UUID values without database foreign keys to BOM
  tables.
- Executor and API offer records form separate models connected by published
  identifiers, not shared tables.

## Messaging

### Integration Queues

| Queue                       | Producer       | Consumer                | Purpose                                   |
| --------------------------- | -------------- | ----------------------- | ----------------------------------------- |
| `savis.offer.requests`      | API BOM module | Executor API subscriber | Request offer acquisition                 |
| `savis.offer.results`       | Executor       | API Supply module       | Publish valid or refreshed offers         |
| `savis.offer.invalidations` | Executor       | API Supply module       | Remove an offer from pricing availability |

All three are durable classic queues. Executor result and invalidation messages
use persistent delivery.

The Executor subscriber:

- uses manual acknowledgements;
- sets prefetch to `1`;
- acknowledges only after task enqueueing succeeds;
- rejects failed messages with `requeue=false`;
- reconnects after broker failures.

The API Supply listeners also disable requeue for rejected messages.

Celery uses the same RabbitMQ instance but its task queues are an internal
Executor concern, not integration contracts.

### Delivery Semantics

Messaging is effectively at-least-once at system boundaries. Consumers must be
idempotent:

- API offers reconcile by public UUID and provider identity;
- Executor offers reconcile by `(provider_identifier, external_id)`;
- invalidation changes availability instead of relying on physical deletion.

A dead-letter strategy for rejected integration messages is not yet
implemented.

## Operational Characteristics

### Health Model

| Component  | Endpoint or check                          | Meaning                                    |
| ---------- | ------------------------------------------ | ------------------------------------------ |
| API        | `/actuator/health/readiness`               | Spring readiness and required dependencies |
| Executor   | `/health`                                  | PostgreSQL and RabbitMQ are reachable      |
| Executor   | `/health/live`                             | HTTP process is alive                      |
| Admin      | `/health`                                  | Nginx is serving                           |
| PostgreSQL | `pg_isready`                               | Database accepts connections               |
| RabbitMQ   | `rabbitmq-diagnostics ping`                | Broker node responds                       |
| Chrome     | `/json/version` on ports `9222` and `9223` | Browser and Docker relay are reachable     |

Production deployment fails when API, Executor, or Admin does not expose a
healthy Docker status. Failure diagnostics include container logs and recent
health-check output.

### Concurrency and Backpressure

- Celery worker concurrency is `1`.
- Worker prefetch is `1`.
- Each child process handles at most 10 tasks.
- Provider access state is persisted in PostgreSQL for coordination across
  tasks and restarts.
- Celery tasks have a 30-minute hard time limit.

These settings favor provider safety and deterministic browser use over
throughput.

### Security Boundaries

- Production publishes only the Admin port.
- Database and broker credentials come from external environment files.
- Supabase writes use the service-role key only inside the API.
- Supabase RLS controls public catalog reads and customer submissions.
- Chrome relay port `9223` must be blocked from the public network.
- The Admin browser never writes directly to Supabase.

## Delivery Architecture

```mermaid
flowchart LR
  Commit["Conventional commits<br/>on main"]
  RP["Release Please<br/>release pull request"]
  Tag["SemVer tag<br/>vX.Y.Z"]
  CI["Reusable CI<br/>Java, Python, Admin, deployment"]
  Images["GHCR images<br/>immutable digests"]
  Package["Release package<br/>Compose, migrations<br/>release.env, deploy script"]
  Host["Ubuntu production host"]

  Commit --> RP
  RP -->|merge| Tag
  Tag --> CI
  CI --> Images
  Images --> Package
  Package --> Host
```

The release workflow:

1. checks out the tagged commit and verifies it belongs to `main`;
2. runs the reusable CI workflow;
3. builds API, Admin, and Executor images;
4. publishes version and source-SHA tags to GHCR;
5. records immutable image digests, SBOMs, and BuildKit provenance;
6. packages `docker-compose.prod.yml`, the deployment script, Supabase migrations,
   and `release.env`;
7. attaches the archive and SHA-256 checksum to the GitHub Release.

The production deployment script:

1. validates the environment, release metadata, image digest format, and disk
   space;
2. verifies Chrome and the relay;
3. backs up the existing PostgreSQL database;
4. pulls immutable images;
5. applies Supabase migrations when enabled;
6. runs Alembic before starting Executor processes;
7. starts API and Executor API and waits for readiness;
8. starts worker, Beat, and Admin;
9. waits for Admin health before updating the `current` symlink.

Flyway runs as part of API startup before API readiness succeeds.

## Architectural Rules

1. Keep domain and core models independent from frameworks.
2. Keep cross-module Java dependencies behind named public APIs or ports.
3. Keep provider code behind Executor `OfferProvider` adapters.
4. Keep provider HTML, selectors, and parsing out of Java.
5. Keep the host browser lifecycle outside Celery and Docker.
6. Do not run more than one worker process against the shared Chrome profile.
7. Do not perform provider collection inside HTTP handlers or RabbitMQ
   callbacks.
8. Keep Java as owner of business state and Python as owner of acquisition
   state.
9. Keep schemas independently migrated and never let one service modify
   another service's tables.
10. Keep Catalog-to-BOM references as UUIDs and avoid JPA relationships across
    module boundaries.
11. Design message consumers for duplicate delivery.
12. Keep pricing recommendations advisory.
13. Keep Supabase as a projection, not a source of internal truth.
14. Require health checks before promoting a production release.

## Known Constraints

- Maxi is currently the only configured provider adapter.
- The dashboard is static and is not an operational read model.
- RabbitMQ integration messages do not yet have a dead-letter queue.
- One shared browser profile limits scraping throughput.
- Chrome requires an active graphical Ubuntu session with `DISPLAY=:0` unless
  the installed user service is customized.
- Production deployment is automated by the packaged script, but the
  repository does not currently contain a dedicated deployment workflow.
- Bulk catalog publication does not currently remove projections for products
  that were changed from published to unpublished; use single-product removal
  to reconcile those projections.
- Customer orders and quote requests exist in Supabase but are not yet managed
  by SAVIS business modules.
