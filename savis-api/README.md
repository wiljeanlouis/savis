# SAVIS API

**SAVIS API** is the Java business backend for [SAVIS](../README.md). It owns
the system of record for technical BOMs, provider offers consumed by BOMs,
activity rates, sellable catalog products, pricing analysis, and catalog
publication.

The service exposes the business HTTP API used by
[SAVIS Admin](../savis-admin/README.md), exchanges offer messages with
[SAVIS Executor](../savis-executor/README.md), persists its state in
PostgreSQL, and publishes a customer-facing catalog projection to Supabase.

## Navigation

- [Responsibilities](#responsibilities)
- [Architecture](#architecture)
- [Business Slices](#business-slices)
- [HTTP API](#http-api)
- [RabbitMQ Contracts](#rabbitmq-contracts)
- [Persistence](#persistence)
- [Configuration](#configuration)
- [Technology](#technology)
- [Local Development](#local-development)
- [Docker](#docker)
- [Tests](#tests)
- [Current Boundaries](#current-boundaries)

## Responsibilities

- Manage generic technical BOMs, components, activities, and yields.
- Calculate BOM costs from provider offers and global activity rates.
- Request offer acquisition for BOM component names.
- Consume valid offer results and invalidations from SAVIS Executor.
- Expose available offers for BOM component selection.
- Manage product categories and sellable catalog products.
- Validate product structures and common BOM references.
- Analyze product configuration costs, margins, and conservative worst cases.
- Publish products marked for publication to Supabase.

SAVIS API does not scrape provider websites, execute asynchronous acquisition
tasks, or serve the customer-facing catalog directly.

## Runtime Context

```text
SAVIS Admin
    |
    | HTTP /api/*
    v
+---------------------------+
| SAVIS API                 |
| Spring Boot               |
|                           |
| BOM | Supply | Catalog    |
+-----+--------+------------+
      |        |
      |        +------> Supabase REST API
      |                  published catalog projection
      |
      +<-------------> RabbitMQ <-------------> SAVIS Executor
      |               offer queues
      v
 PostgreSQL
 savis_api schema
```

See [the system architecture](../docs/ARCHITECTURE.md) for the complete C4
views and cross-system business flows.

## Architecture

The codebase is a Spring Modulith application organized as pragmatic vertical
slices with domain, use-case, port, and adapter packages:

```text
src/main/java/com/savouretplus/savis/
|-- bom/
|   |-- api/                    # Public BOM pricing interface
|   |-- domain/
|   |-- usecase/
|   |-- port/
|   |-- adapter/
|   |   |-- web/
|   |   |-- persistence/
|   |   |-- messaging/
|   |   `-- external/
|   `-- config/
|-- supply/
|   |-- api/                    # Public offer pricing interface
|   |-- domain/
|   |-- usecase/
|   |-- port/
|   |-- adapter/
|   |   |-- web/
|   |   |-- persistence/
|   |   `-- messaging/
|   `-- config/
|-- catalog/
|   |-- domain/
|   |-- usecase/
|   |-- port/
|   |-- adapter/
|   |   |-- web/
|   |   |-- persistence/
|   |   |-- bom/
|   |   `-- supabase/
|   `-- config/
`-- common/                     # Money, Quantity, and Unit
```

The slices collaborate through explicit public contracts:

- BOM consumes `SupplyApi` to price components.
- Catalog consumes `BomPricingApi` through its own `BomPricingPort`.
- Catalog stores BOM UUIDs as values and does not access BOM entities or
  repositories.

`SavisApiModularityTests` uses Spring Modulith to verify module boundaries and
generate documentation snippets.

## Business Slices

### BOM

A BOM is a reusable technical composition. It can currently be typed as:

- `FOOD`;
- `DECORATION`.

A BOM contains:

- public UUID and descriptive information;
- components with name, quantity, unit, and optional selected offer UUID;
- sequenced activities with type and duration in minutes;
- a yield quantity and unit.

Supported component and yield units:

- `g`;
- `kg`;
- `l`;
- `ml`;
- `piece`;
- `portion`.

Units are normalized to base dimensions for cost calculation: kilograms to
grams and liters to milliliters. Piece and portion remain distinct dimensions.

Supported activity types:

- `PREP`;
- `COOK`;
- `ASSEMBLY`;
- `PACKAGING`;
- `INSTALLATION`;
- `DELIVERY`;
- `CLEANUP`;
- `CUSTOM`.

#### BOM Cost

For each component, the BOM slice:

1. uses its selected offer when that UUID still resolves;
2. otherwise searches for the cheapest available offer with a compatible unit;
3. prorates the package price to the requested component quantity;
4. returns zero when no priced compatible offer is available.

Component cost:

```text
offer price * requested base quantity / package base quantity
```

Activity cost:

```text
minutes / 60 * global hourly rate
```

Total BOM cost:

```text
sum(component costs) + sum(activity costs)
```

Missing activity rates contribute zero. BOM list responses include the
calculated total price; the dedicated price endpoint recalculates one BOM.

#### Component Acquisition

After a BOM is saved, the BOM slice publishes one component-needed message per
component. The payload contains the normalized component name and BOM type.
SAVIS Executor decides whether a new acquisition task is necessary.

### Supply

The Supply slice stores the provider offers that SAVIS Executor has validated
and published.

An offer includes:

- public and provider product identifiers;
- component search term;
- label, brand, image, and product URL;
- price and package size;
- provider identity;
- last-seen timestamp;
- availability status.

Incoming offers are reconciled first by public UUID, then by
`(externalId, provider.identifier)`. An invalidation marks the corresponding
offer unavailable instead of deleting it.

Only available offers are exposed to BOM workflows. Searches are
case-insensitive and ordered by package price.

### Catalog

The Catalog slice owns:

- product categories;
- sellable products;
- purchase modes;
- common product BOM references;
- customer choice groups;
- customizable ingredient options;
- pricing analysis;
- Supabase publication.

Supported product types:

- `STANDARD`;
- `SINGLE_CHOICE`;
- `SINGLE_CHOICE_BUNDLE`;
- `INGREDIENT_CUSTOMIZATION`.

#### Product BOM References

A product owns an ordered collection of common `ProductBom` values:

```json
{
  "id": null,
  "bomId": "4a7a05f4-c5f6-4e9e-a11d-855a349f5300",
  "quantity": 1.5,
  "displayOrder": 0
}
```

Each `ProductBom` requires:

- a BOM UUID;
- a strictly positive decimal quantity;
- a non-negative display order.

The collection may be empty. Product creation and update reject a
`ProductBom.bomId` that does not exist at save time.

Choice-option and ingredient-option `bomId` values remain optional and are not
validated during product save. They represent customer-specific costs rather
than the common base composition.

#### Product Cost

Catalog retrieves each referenced BOM's total cost and yield through
`BomPricingPort`.

```text
unitCost(bomId) = BOM total cost / BOM yield quantity
commonCost = sum(unitCost(productBom.bomId) * productBom.quantity)
```

Cost rules:

- standard: `commonCost`;
- single choice: `commonCost + choice unit cost * purchase-mode quantity`;
- single choice without a selected mode: use a quantity of `1`;
- choice allocation: `commonCost + sum(choice unit cost * allocated quantity)`;
- ingredient customization:
  `commonCost + sum(extra unit cost * max(0, selected - default))`.

Default extras are not counted twice. Removing an ingredient below its default
quantity does not reduce the reference cost.

The conservative bundle analysis adds the common cost to the most expensive
active choice BOM multiplied by the selected mode quantity.

An analysis becomes `INCOMPLETE` when a required BOM UUID is absent, no longer
resolves, has no valid cost, or has a non-positive yield. This also covers a
common `ProductBom` deleted after product save. Missing UUIDs are returned when
known.

#### Pricing Analysis

Pricing analysis returns:

- analyzed quantity;
- selected sale price;
- total and unit cost;
- actual and target margin;
- recommended price;
- completeness and missing BOM UUIDs;
- status: `GOOD`, `REVIEW`, `LOSS`, or `INCOMPLETE`.

The sale price comes from the active purchase mode when selected, otherwise
from the product base price. Customizable ingredient prices are added only for
quantities above their defaults.

Recommended price:

```text
cost / (1 - target margin)
```

It is rounded upward to the next CAD 0.25. The recommendation is advisory and
never changes a product or purchase-mode sale price.

#### Catalog Publication

`CatalogPublicationService.publishAll()` publishes products whose `published`
flag is true. Publication can be triggered:

- explicitly through the HTTP API;
- periodically with `savis.catalog.refresh-cron`, hourly by default.

When Supabase is disabled, scheduled publication is skipped and explicit
publication returns a bad-request error.

The Supabase adapter upserts rows into:

```text
published_catalog_products
```

The public projection includes customer-facing product content, active
purchase modes, active choices, active ingredients, availability, images, and
prices in cents. It excludes:

- common `productBoms`;
- internal costs and missing-BOM diagnostics;
- target margins;
- recommended prices.

Optional choice and ingredient `bom_id` values remain in the projection.
PostgreSQL remains the catalog system of record; Supabase is a read projection.

Bulk publication reads only products whose `published` flag is currently true.
It does not yet reconcile Supabase rows for products newly changed to
unpublished. The single-product publication path supports unpublishing, but it
is not currently exposed by the HTTP controller.

## HTTP API

The service listens on port `8080` by default. OpenAPI documentation is
available at:

```text
http://localhost:8080/swagger-ui.html
```

Spring Problem Details is enabled. Catalog not-found errors return `404`;
invalid catalog structures and disabled explicit publication return `400`.

Actuator health endpoints:

| Path | Purpose |
| --- | --- |
| `/actuator/health/liveness` | Confirms that the API process is alive. |
| `/actuator/health/readiness` | Reports whether the API is ready for traffic. |

### BOM Endpoints

| Method   | Path                      | Purpose                                         |
| -------- | ------------------------- | ----------------------------------------------- |
| `GET`    | `/api/boms`               | List BOMs with calculated prices.               |
| `GET`    | `/api/boms/{bomId}`       | Retrieve one BOM.                               |
| `GET`    | `/api/boms/{bomId}/price` | Calculate one BOM total cost.                   |
| `POST`   | `/api/boms`               | Create or replace a BOM using the payload UUID. |
| `DELETE` | `/api/boms/{bomId}`       | Delete one BOM.                                 |

Example:

```json
{
  "id": null,
  "name": "Pâté kòde",
  "description": "Composition technique",
  "imageUrl": "https://example.com/pate.jpg",
  "instructions": "Préparer et cuire.",
  "type": "FOOD",
  "components": [
    {
      "componentName": "farine",
      "quantity": 500,
      "unit": "g",
      "selectedOfferId": null
    }
  ],
  "activities": [
    {
      "id": null,
      "type": "PREP",
      "minutes": 30,
      "sequence": 1
    }
  ],
  "yield": {
    "quantity": 12,
    "unit": "piece"
  }
}
```

### Activity-Rate Endpoints

| Method   | Path                                 | Purpose                |
| -------- | ------------------------------------ | ---------------------- |
| `GET`    | `/api/activity-rates`                | List configured rates. |
| `GET`    | `/api/activity-rates/{activityType}` | Retrieve one rate.     |
| `POST`   | `/api/activity-rates`                | Create one rate.       |
| `PUT`    | `/api/activity-rates/{activityType}` | Update one rate.       |
| `DELETE` | `/api/activity-rates/{activityType}` | Delete one rate.       |

Only one rate can exist for each activity type.

```json
{
  "activityType": "PREP",
  "hourlyRate": {
    "amount": 60,
    "currency": "CAD"
  }
}
```

### Supply Endpoints

| Method | Path                                      | Purpose                                      |
| ------ | ----------------------------------------- | -------------------------------------------- |
| `GET`  | `/api/supply/offers?componentName={name}` | Search available offers for a BOM component. |

### Product Endpoints

| Method   | Path                                                                        | Purpose                                                |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GET`    | `/api/catalog/products`                                                     | List catalog products.                                 |
| `GET`    | `/api/catalog/products/{productId}`                                         | Retrieve one product.                                  |
| `POST`   | `/api/catalog/products`                                                     | Create a product.                                      |
| `PUT`    | `/api/catalog/products/{productId}`                                         | Update a product.                                      |
| `DELETE` | `/api/catalog/products/{productId}`                                         | Delete a product.                                      |
| `POST`   | `/api/catalog/products/{productId}/pricing-analysis`                        | Analyze one selected configuration.                    |
| `GET`    | `/api/catalog/products/{productId}/worst-case-pricing?purchaseModeCode=...` | Analyze a composable bundle's conservative worst case. |
| `POST`   | `/api/catalog/products/publish`                                             | Publish every product marked for publication.          |

Pricing configuration payload:

```json
{
  "purchaseModeCode": "dozen",
  "choiceCode": null,
  "allocations": [
    {
      "choiceCode": "chicken",
      "quantity": 6
    },
    {
      "choiceCode": "beef",
      "quantity": 6
    }
  ],
  "ingredients": []
}
```

### Category Endpoints

| Method   | Path                                   | Purpose                  |
| -------- | -------------------------------------- | ------------------------ |
| `GET`    | `/api/catalog/categories`              | List product categories. |
| `POST`   | `/api/catalog/categories`              | Create a category.       |
| `PUT`    | `/api/catalog/categories/{categoryId}` | Update a category.       |
| `DELETE` | `/api/catalog/categories/{categoryId}` | Delete a category.       |

## RabbitMQ Contracts

The application declares durable classic queues and uses Jackson JSON message
conversion.

### Component Requests

Queue: `savis.offer.requests`

Published after a BOM save:

```json
{
  "content": "farine",
  "type": "FOOD"
}
```

### Offer Results

Queue: `savis.offer.results`

SAVIS API consumes executor results, converts them to Supply offers, and
reconciles them into PostgreSQL.

```json
{
  "id": "task-id",
  "offers": [
    {
      "id": "01975c75-9eb3-7000-8000-000000000001",
      "external_id": "provider-product-id",
      "url": "https://provider.example/product",
      "brand": "Example",
      "label": "Flour",
      "price": {
        "amount": "4.99",
        "currency": "CAD"
      },
      "package_size": {
        "value": "1",
        "unit": "kg"
      },
      "image_url": "https://provider.example/product.jpg",
      "search_term": "farine",
      "provider": {
        "name": "Provider",
        "identifier": "store-id",
        "site": "https://provider.example",
        "address": "Store address"
      }
    }
  ]
}
```

### Offer Invalidations

Queue: `savis.offer.invalidations`

```json
{
  "id": "01975c75-9eb3-7000-8000-000000000001",
  "external_id": "provider-product-id",
  "provider_identifier": "store-id"
}
```

The listener container sets `defaultRequeueRejected=false`, preventing malformed
or permanently failing messages from being redelivered indefinitely.

## Persistence

PostgreSQL data is stored in the `savis_api` schema.

Main tables:

- `boms`;
- `bom_components`;
- `bom_activities`;
- `activity_rates`;
- `offers`;
- `catalog_product_categories`;
- `catalog_products`;
- `catalog_product_boms`;
- `catalog_product_purchase_modes`;
- `catalog_product_choice_groups`;
- `catalog_product_choice_options`;
- `catalog_product_ingredient_options`;
- `event_publication`, managed by Spring Modulith for event-publication
  infrastructure.

Persistence conventions:

- database primary keys are generated `Long` values;
- public and API identifiers are UUIDs;
- units are persisted as symbols;
- catalog child collections use cascade and orphan removal;
- `ProductBom.bomId`, choice BOM UUIDs, and ingredient BOM UUIDs are plain UUID
  columns, not JPA relationships to BOM entities;
- the product gallery is stored as PostgreSQL `jsonb`;
- supply offers are reconciled by public UUID or provider identity.

The application currently uses:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.default_schema=savis_api
spring.flyway.enabled=true
spring.flyway.default-schema=savis_api
spring.flyway.schemas=savis_api
spring.flyway.create-schemas=true
```

Flyway owns schema evolution through versioned SQL files under
`src/main/resources/db/migration`. Hibernate validates the mapped model against
the migrated schema at startup and does not modify production tables.

Tests use H2 in PostgreSQL compatibility mode with `ddl-auto=create-drop`;
Flyway is disabled in the test profile.

## Configuration

| Environment variable         | Default                                       | Purpose                              |
| ---------------------------- | --------------------------------------------- | ------------------------------------ |
| `SPRING_DATASOURCE_URL`      | `jdbc:postgresql://localhost:5432/mydatabase` | PostgreSQL JDBC URL.                 |
| `SPRING_DATASOURCE_USERNAME` | `myuser`                                      | Database user.                       |
| `SPRING_DATASOURCE_PASSWORD` | `mypassword`                                  | Database password.                   |
| `SPRING_RABBITMQ_HOST`       | `localhost`                                   | RabbitMQ host.                       |
| `SPRING_RABBITMQ_PORT`       | `5672`                                        | RabbitMQ port.                       |
| `SPRING_RABBITMQ_USERNAME`   | Spring Boot default                           | RabbitMQ user.                       |
| `SPRING_RABBITMQ_PASSWORD`   | Spring Boot default                           | RabbitMQ password.                   |
| `SUPABASE_ENABLED`           | `false`                                       | Enable the Supabase catalog adapter. |
| `SUPABASE_URL`               | empty                                         | Supabase project URL.                |
| `SUPABASE_SERVICE_ROLE_KEY`  | empty                                         | Supabase service-role credential.    |
| `SAVIS_CATALOG_REFRESH_CRON` | `0 0 * * * *`                                 | Published-catalog refresh schedule.  |

Application properties can also override:

- `savis.offer.request.queue`;
- `savis.offer.result.queue`;
- `savis.offer.invalidation.queue`;
- `savis.offer.listener.auto-startup`.

Additional runtime settings:

- Spring MVC Problem Details is enabled;
- virtual threads are enabled;
- Hibernate SQL logging is disabled;
- Flyway applies API migrations before Hibernate validation;
- Actuator exposes `health` and `info`, including liveness and readiness probes;
- Actuator and Spring Modulith observability dependencies are present;
- CORS on current business controllers allows `http://localhost:5173`;
- authentication and authorization are not currently configured.

## Technology

- Java 25
- Spring Boot 4.1
- Spring Modulith 2.0.5
- Spring MVC
- Spring Data JPA and Hibernate
- Flyway
- Spring AMQP
- PostgreSQL
- H2 for tests
- Springdoc OpenAPI
- MapStruct annotation processing
- Lombok
- JUnit 5, Mockito, and WireMock

## Local Development

Requirements:

- Java 25;
- PostgreSQL;
- RabbitMQ.

Run the application:

```bash
./mvnw spring-boot:run
```

Run all tests:

```bash
./mvnw test
```

Build the executable JAR:

```bash
./mvnw clean package
```

The API starts at `http://localhost:8080`.

Flyway runs automatically at startup. The configured PostgreSQL database must
be reachable before launching the application.

To run the complete SAVIS environment from the repository root:

```bash
docker compose up --build
```

## Docker

The Dockerfile provides:

- `development`: Maven with Java 25 and `spring-boot:run`;
- `build`: executable JAR packaging without tests;
- `production`: a non-root Java 25 runtime image exposing port `8080`, with a
  readiness health check at `/actuator/health/readiness`.

## Tests

The test suite covers:

- common value objects and unit conversion;
- BOM domain validation, DTO mapping, component pricing, and service behavior;
- activity-rate workflows;
- Supply offer processing, messaging, and configuration;
- Product BOM validation and persistence reconciliation;
- product creation, update, configuration pricing, and worst-case pricing;
- catalog publication and Supabase requests;
- published projection mapping;
- Spring context startup with H2;
- Spring Modulith boundary verification.

Useful targeted checks:

```bash
./mvnw -Dtest=BomTest,BomDtoTest,MinuteTest,ActivityRateServiceTest,BomServiceTest test
./mvnw -Dtest=OfferServiceTest,OffersListenerTest,SpringSupplyConfigTest test
./mvnw -Dtest=ProductBomTest,ProductServiceTest,ProductPricingServiceTest test
./mvnw -Dtest=CatalogPublicationServiceTest,SupabaseCatalogAdapterTest,SavisApiModularityTests test
```

## Current Boundaries

- SAVIS API is the business system of record; Supabase is only a published
  projection.
- SAVIS Executor owns scraping, acquisition task execution, and offer review.
- Catalog references BOMs only by UUID and public pricing contract.
- BOM references Supply through its public API instead of Supply persistence.
- Flyway owns the Java schema; Hibernate only validates it in production.
- Bulk catalog publication does not yet reconcile newly unpublished Supabase
  rows.
- No authentication or authorization layer is currently present.
