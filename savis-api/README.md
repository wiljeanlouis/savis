# SAVIS API

**SAVIS API** is the Java business backend for [SAVIS](../README.md). It owns
the system of record for technical BOMs, provider offers consumed by BOMs,
activity rates, resources, sellable catalog products, pricing analysis, catalog
publication, orders, quotations, and invoices.

The service exposes the business HTTP API used by
[SAVIS Admin](../savis-admin/README.md), exchanges offer messages with
[SAVIS Executor](../savis-executor/README.md), persists its state in
PostgreSQL, and publishes a customer-facing catalog projection to Supabase.

## Navigation

- [SAVIS API](#savis-api)
  - [Navigation](#navigation)
  - [Responsibilities](#responsibilities)
  - [Runtime Context](#runtime-context)
  - [Architecture](#architecture)
  - [Business Slices](#business-slices)
    - [Resource](#resource)
    - [Supply](#supply)
    - [BOM](#bom)
    - [Catalog](#catalog)
    - [Order](#order)
    - [Quotation](#quotation)
    - [Invoice](#invoice)
  - [HTTP API](#http-api)
    - [Errors](#errors)
    - [Resource Endpoints](#resource-endpoints)
    - [Supply Endpoints](#supply-endpoints)
    - [BOM Endpoints](#bom-endpoints)
    - [Activity-Rate Endpoints](#activity-rate-endpoints)
    - [Product Endpoints](#product-endpoints)
    - [Order Endpoints](#order-endpoints)
    - [Quotation Endpoints](#quotation-endpoints)
    - [QuoteRequest Endpoints](#quoterequest-endpoints)
    - [Invoice Endpoints](#invoice-endpoints)
  - [Supabase Integration](#supabase-integration)
    - [Catalog projection](#catalog-projection)
    - [Customer-order inbox](#customer-order-inbox)
    - [Quote-request inbox](#quote-request-inbox)
  - [RabbitMQ Contracts](#rabbitmq-contracts)
    - [Component Requests](#component-requests)
    - [Offer Results](#offer-results)
    - [Offer Invalidations](#offer-invalidations)
  - [Persistence](#persistence)
  - [Configuration](#configuration)
  - [Technology](#technology)
  - [Local Development](#local-development)
  - [Docker](#docker)
  - [Health and Operations](#health-and-operations)
  - [Tests](#tests)
  - [Further Documentation](#further-documentation)

## Responsibilities

The API owns business validation, technical costing, commercial pricing,
customer documents, and persistence for the seven modules described below.
It integrates with Executor for supplier offers and Supabase for catalog
publication and manual web-order import. Provider scraping and acquisition tasks
belong to Executor; the customer-facing catalog is served from Supabase.

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
| BOM, Resource, Supply     |
| Catalog, Order, Quotation |
| Invoice                   |
+-----+--------+------------+
      |        |
      |        +------> Supabase REST API
      |                  catalog publication + order inbox
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

The codebase is a Spring Modulith application with seven vertical business
slices under `src/main/java/com/savouretplus/savis/`:

```text
bom/          resource/     supply/       catalog/
order/        quotation/    invoice/      common/
```

Each business slice separates `domain` (invariants and value objects), `usecase`
(workflow orchestration), `port` (dependencies), and `adapter` (HTTP,
persistence, messaging, external services, or PDF rendering). Modules with public
contracts expose an `api` package; Spring wiring belongs in `config` where needed.
`common` holds shared quantities, money, units, and PDF font support.


The slices collaborate through explicit public contracts:

- BOM consumes `SupplyApi` to price components.
- Catalog consumes `BomPricingApi` through its own `BomPricingPort`.
- Order consumes `CatalogOrderingApi`, `BomRequirementsApi`, and `SupplyApi`
  through local ports to generate production-requirement reports.
- Quotation consumes `CatalogOrderingApi` for price snapshots and
  `QuotationOrderApi` for conversion.
- Invoice consumes `OrderInvoicingApi` for locked snapshots, without accessing
  Order persistence or repricing through Catalog.
- Catalog stores BOM UUIDs as values and does not access BOM entities or
  repositories.
- BOM and Supply validate resource UUIDs through `ResourceCatalogApi`; the API
  exposes an immutable reference view and never exposes Resource persistence.

`SavisApiModularityTests` uses Spring Modulith to verify module boundaries and
generate documentation snippets. Sales children are explicitly declared closed
nested modules with stable IDs `sales.quotation`, `sales.order`, and
`sales.invoice` and public-interface dependency allowlists. Order retains the
`order` named interface (`QuotationOrderApi`, `OrderInvoicingApi`). Catalog
remains a separate top-level module and has no Sales dependency. Negative fixture
tests prove that sibling entity and repository access fails verification.
See [Sales audit, options, and module graphs](../docs/SALES_REFACTORING.md).

## Business Slices

Each module owns a distinct part of the business workflow:

| Module | Role |
| --- | --- |
| Resource | Define the ingredients, materials, and equipment used by BOMs. |
| Supply | Maintain supplier offers and their association with resources. |
| BOM | Describe how something is produced and calculate its technical cost. |
| Catalog | Define what can be sold, its configurations, prices, and publication. |
| Order | Record customer commitments and derive production requirements. |
| Quotation | Prepare a commercial proposal and convert acceptance into an order. |
| Invoice | Bill an order using its agreed commercial snapshots. |

Detailed formulas, valuation diagnostics, and migration procedures are in the
[Business Reference](../docs/SAVIS_API_BUSINESS_REFERENCE.md).

### Resource

**Role:** maintain the reference catalog shared by BOM components and supplier
offers. A resource identifies what is consumed or used, independently of a
supplier's product or packaging.

**Key rules:**

- Categories are `INGREDIENT`, `CONSUMABLE`, `PACKAGING`, `EQUIPMENT`, and
  `DECORATION_MATERIAL`.
- Ingredients, consumables, and packaging require a reference unit.
- Resources can be active or inactive. New BOM references require an active
  resource; unchanged historical references to inactive resources remain valid.
- This module does not track stock quantities or equipment availability.

### Supply

**Role:** maintain the local supplier-offer projection used to value BOMs.
Offers contain supplier identity, price, package size, availability, and an
optional resource association. They arrive from Executor or manual entry.

**Key rules:**

- Incoming offers are reconciled by public UUID, then by supplier product identity.
- Invalidation marks an offer unavailable rather than deleting it.
- Resource associations are explicit and validated against Resource. Acquisition
  search terms are metadata, not resource identifiers.
- Automatic price selection considers available offers. Existing unavailable
  selections remain readable with their last observed price.
- Executor owns scraping, acquisition tasks, and offer review.

### BOM

**Role:** describe a reusable technical composition (`FOOD` or `DECORATION`):
resource quantities, optional selected offers, sequenced activities, and yield.
BOM also owns the global hourly rate for each activity type.

**Key rules:**

- Component units must match the resource dimension. Mass and volume units can
  be converted within their dimension; pieces and portions remain distinct.
- Activity types are `PREP`, `COOK`, `ASSEMBLY`, `PACKAGING`, `INSTALLATION`,
  `DELIVERY`, `CLEANUP`, and `CUSTOM`, with one hourly rate per type.
- Material cost prorates package price to the quantity consumed. Activity cost
  is duration in hours multiplied by the configured hourly rate.
- A valid selected offer takes precedence. Without a selection, or when its UUID
  no longer resolves, pricing searches for the cheapest compatible available
  offer for the same resource. An invalid resolved selection blocks valuation;
  an unavailable selection keeps its observed price with a warning.
- Missing prices or activity rates make valuation incomplete; they never imply
  zero cost. An explicit zero is valid. A positive yield is required for a
  complete valuation usable by Catalog.
- Saving a BOM does not trigger acquisition. List reads return composition;
  detail and price reads calculate current costs from existing Supply data.

### Catalog

**Role:** define sellable products, purchase modes, customer choices, ingredient
options, profitability analysis, and publication to Supabase. Catalog consumes
BOM costs and yields; it does not own technical compositions.

**Key rules:**

- Commercial nature (`GOODS` or `SERVICE`) is independent of configuration type:
  `STANDARD`, `SINGLE_CHOICE`, `SINGLE_CHOICE_BUNDLE`, or
  `INGREDIENT_CUSTOMIZATION`.
- Every product requires an active purchase mode. Sale prices come from purchase
  modes, with ingredient surcharges only above default quantities.
- Common BOM references require an existing BOM and a positive quantity. Choice
  and ingredient BOM references are optional. An optional subcategory must belong
  to the product's category.
- Costs combine common BOMs with the selected configuration, using each BOM's
  yield. Incomplete costs expose diagnostics rather than a complete total or margin.
- Recommended prices use the target margin and round upward to CAD 0.25. They
  are advisory and never overwrite sale prices.
- Publication is explicit and requires Supabase to be enabled. The public
  projection excludes internal costs and margins. Bulk publication does not
  remove newly unpublished products; use the single-product unpublish operation.

### Order

**Role:** record customer orders, preserve commercial item/configuration
snapshots, manage fulfilment, and generate current production requirements.
Orders originate from Admin, manual Supabase import, or accepted quotations.

**Key rules:**

- Administrative entry validates selections and prices against Catalog. Web
  import preserves submitted snapshots and is idempotent by source/external UUID;
  Supabase acknowledgement follows successful local persistence. Both entry
  paths create `NEW` orders; accepted quotation conversions enter as `ACCEPTED`.
- Administrative orders can be replaced only while `NEW`. Imported web orders
  allow customer corrections while `NEW`, without changing item or price snapshots.
- The normal lifecycle is `NEW → ACCEPTED → IN_PREPARATION → READY → COMPLETED`.
  Rejection is available from `NEW`; cancellation is available before completion.
- Order total is item subtotal minus discount plus delivery fee; orders do not
  calculate taxes. Customer phones use Canada as the default region and are
  stored in E.164 format. Addresses normalize whitespace and province casing,
  and validate Canadian postal codes.
- Production requirements use current Catalog, BOM, and Supply data. They do not
  change agreed prices or estimate inventory-adjusted purchases.

### Quotation

**Role:** prepare a commercial proposal (soumission), preserve its priced
configuration, generate its PDF, and convert acceptance into an order.

**Key rules:**

- Creation captures current Catalog prices and requires a validity date.
- Only `DRAFT` quotations can be edited. The lifecycle is `DRAFT → SENT`, then
  `SENT → ACCEPTED` or `SENT → REJECTED`.
- Only accepted quotations can be converted. Conversion is idempotent and creates
  an `ACCEPTED` order from agreed snapshots without repricing against Catalog.
- Quotation PDFs use persisted snapshots and the quotation validity date.
  Business coordinates and payment conditions are fixed template values.
- `QuoteRequest` is a distinct aggregate in this same nested module. Manual
  import receives and preserves the initial customer need without creating a
  quotation or order. Qualification uses `RECEIVED`, `IN_PROGRESS`, `QUOTED`,
  and `CLOSED` (mandatory closing reason), with an explicitly compared client version.
- One request can produce multiple independent quotations. Each creation intention
  has a stable UUID and canonical fingerprint; identical replays return the
  original quotation, conflicting replays return 409. Existing quotations retain
  their snapshots and optional `sourceQuoteRequestId` through later edits.
- See the [QuoteRequest contract](../docs/integration/quote-request-implementation.md)
  for qualification, transaction boundaries, HTTP payloads and operational limitations.

### Invoice

**Role:** bill an eligible order from its persisted commercial snapshots and
produce the final invoice PDF.

**Key rules:**

- An order must be `ACCEPTED`, `IN_PREPARATION`, `READY`, or `COMPLETED` to be
  invoiced. Only one invoice is allowed per order, including after cancellation.
- New invoices are `DRAFT` without a number. Draft edits allow customer details,
  notes, discount, delivery fee, and explicit GST/QST amounts; item snapshots stay
  fixed. Taxes start at zero and are not calculated from rates.
- Issuing assigns a permanent number and freezes editable data. Draft or issued
  invoices can be cancelled; cancellation does not create a credit note.
- Final PDFs require prior issuance. An issued invoice remains documentable after
  cancellation and is never repriced from current Catalog data.

## HTTP API

The service listens on port `8080` by default. OpenAPI documentation is
available at:

```text
http://localhost:8080/swagger-ui.html
```

The OpenAPI JSON is available at `/v3/api-docs`. Paths below are direct API
paths; Admin reaches them through its `/savis-api` proxy. Public identifiers are
UUIDs. Request/response schemas are defined by the controller DTOs and OpenAPI.

### Errors

Spring Problem Details is enabled. Feature exception handlers map validation
errors to `400`, missing Catalog/Resource/Order/Quotation/Invoice references to
`404`, and forbidden Order/Quotation/Invoice lifecycle operations to `409`.
Catalog invalid state and disabled publication return `400`; disabled order
import returns `409`. Business validation messages are in French. These mappings
are feature-specific; BOM persistence failures, for example, return `500`.

### Resource Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/resources?search=&category=&status=&page=&size=&sort=` | Search/paginate resources. |
| `GET` | `/api/resources/batch?ids=<uuid>,<uuid>` | Resolve 1–100 distinct resource references. |
| `GET` | `/api/resources/{id}` | Retrieve a resource, including inactive historical references. |
| `POST` | `/api/resources` | Create a resource. |
| `PUT` | `/api/resources/{id}` | Update resource definition. |
| `PATCH` | `/api/resources/{id}/status` | Activate/deactivate a resource. |

Resource search defaults to page `0`, size `20`, and `sort=name,asc`.
Pages are zero-based and size must be 1–100. Optional filters are `search`,
`category`, and `status`; search is limited to 160 characters. Sorting accepts
`name`, `category`, or `referenceUnit` with `asc`/`desc`. Unknown sorts return
`400`. Filtering and sorting precede database pagination; the response contains
`content`, `totalElements`, `page`, `size`, and `totalPages`. Category sorting
follows French labels; units use displayed symbols, with nulls last.

The batch endpoint accepts 1–100 input UUIDs, collapses duplicates, and returns
an array of Resource responses, including inactive resources. Unknown UUIDs are
omitted; invalid input returns `400`.

### Supply Endpoints

| Method | Path                                      | Purpose                                      |
| ------ | ----------------------------------------- | -------------------------------------------- |
| `GET`  | `/api/supply/offers?componentName={name}` | Legacy name-based available-offer search. |
| `GET` | `/api/supply/offers/catalog?page=&size=&search=&status=&sort=` | Search persisted offers with database pagination. |
| `POST` | `/api/supply/offers` | Create a manual offer with a validated resource. |
| `PUT` | `/api/supply/offers/{id}/resource` | Validate or change the resource association. |
| `GET` | `/api/supply/offers/resource/{resourceId}` | Resource offers; optional `availableOnly=true`. |

Supply catalog defaults: page `0`, size `20`, status `AVAILABLE`, and
`sort=lastSeen,desc`. Status accepts `AVAILABLE`, `UNAVAILABLE`, or `ALL`. Sort
accepts `lastSeen`, `componentName`, or `price` with `asc` or `desc`. This is the
persisted Supply view. Pages are zero-based and size must be 1–100.
The resource-specific endpoint defaults `availableOnly` to `false`.

### BOM Endpoints

| Method   | Path                      | Purpose                                         |
| -------- | ------------------------- | ----------------------------------------------- |
| `GET`    | `/api/boms`               | List BOMs without calculating costs.            |
| `GET`    | `/api/boms/{bomId}`       | Retrieve one BOM.                               |
| `GET`    | `/api/boms/{bomId}/price` | Return detailed BOM valuation and completeness.                   |
| `POST`   | `/api/boms`               | Create or replace a BOM using the payload UUID. |
| `DELETE` | `/api/boms/{bomId}`       | Delete one BOM.                                 |

BOM component writes require `resourceId`. New or reselected resources supply
the current resource name; unchanged components retain their name snapshot.
Preserve component `id` values during edits to keep row identities. Supported
quantity/yield symbols are `g`, `kg`, `ml`, `l`, `piece`, and `portion`.

List responses leave `price` and `costing` null. Detail responses include
`costing`, with `price` populated only for complete valuation. The price endpoint
returns the structured valuation (subtotals, lines, diagnostics, yield,
`complete`, and nullable `totalCost`).

Example write payload (use an existing active Resource UUID):

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
      "id": null,
      "resourceId": "c84c583c-2608-4ef0-aad3-16a87eb418c4",
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

Example rate payload:

```json
{
  "activityType": "PREP",
  "hourlyRate": { "amount": 60, "currency": "CAD" }
}
```

### Product Endpoints

| Method   | Path                                                                        | Purpose                                                |
| -------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `GET`    | `/api/catalog/products`                                                     | List or search catalog products.                       |
| `GET`    | `/api/catalog/products/{productId}`                                         | Retrieve one product.                                  |
| `POST`   | `/api/catalog/products`                                                     | Create a product.                                      |
| `PUT`    | `/api/catalog/products/{productId}`                                         | Update a product.                                      |
| `DELETE` | `/api/catalog/products/{productId}`                                         | Delete a product.                                      |
| `POST`   | `/api/catalog/products/{productId}/pricing-analysis`                        | Analyze one selected configuration.                    |
| `GET`    | `/api/catalog/products/{productId}/worst-case-pricing?purchaseModeCode=...` | Analyze a composable bundle's conservative worst case. |
| `POST`   | `/api/catalog/products/{productId}/publish`                                 | Publish one product.                                   |
| `POST`   | `/api/catalog/products/{productId}/unpublish`                               | Remove one product from the published catalog.         |
| `POST`   | `/api/catalog/products/publish`                                             | Publish every product marked for publication.          |

`GET /api/catalog/products` accepts the optional `search`, `availableOnly`,
and `limit` parameters. Supplying any of them enables a bounded database search
over the product code, name, and description; `limit` must be between 1 and
100. Calling the endpoint without these parameters preserves the complete
catalog-management listing.

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

### Order Endpoints

| Method | Path                                 | Purpose                                      |
| ------ | ------------------------------------ | -------------------------------------------- |
| `POST` | `/api/orders`                        | Create an administrative order from catalog selections. |
| `POST` | `/api/orders/import`                 | Manually import orders from the configured inbox. |
| `GET`  | `/api/orders`                        | List normalized local orders.                |
| `GET`  | `/api/orders/{orderId}`              | Retrieve one order and its item snapshots.   |
| `PUT`  | `/api/orders/{orderId}`              | Replace a `NEW` administrative order from current catalog selections. |
| `PATCH` | `/api/orders/{orderId}/customer`     | Correct customer information on a `NEW` imported web order. |
| `GET`  | `/api/orders/{orderId}/requirements` | Generate current aggregated production-component requirements. |
| `PUT`  | `/api/orders/{orderId}/status`       | Apply a valid lifecycle transition.          |

`POST /api/orders` and replacement accept customer details, product UUIDs,
quantities, and configuration codes; names and prices are calculated by the API.
The customer PATCH accepts customer details only. List summaries include an item
count and up to three image previews. Requirement responses include source lines,
warnings, and a `complete` flag. Import responses distinguish fetched, imported,
already imported, failed, and acknowledgement-failed rows; see
[Supabase Integration](#supabase-integration) for retry behavior.

### Quotation Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/quotations` | Create a draft from Catalog selections. |
| `GET` | `/api/quotations` | List quotations. |
| `GET` | `/api/quotations/{quotationId}` | Retrieve a quotation. |
| `PUT` | `/api/quotations/{quotationId}` | Replace a draft. |
| `PUT` | `/api/quotations/{quotationId}/status` | Apply a lifecycle transition. |
| `POST` | `/api/quotations/{quotationId}/convert` | Convert an accepted quotation to an order. |
| `GET` | `/api/quotations/{quotationId}/pdf` | Download the quotation PDF. |

### QuoteRequest Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/quote-requests/import` | Import a bounded pending batch and acknowledge committed requests. |
| `GET` | `/api/quote-requests` | List summaries with bounded pagination, name search, status and stable date sorting. |
| `GET` | `/api/quote-requests/{id}` | Retrieve original need, qualification, history and version. |
| `PUT` | `/api/quote-requests/{id}/qualification` | Save separate qualified data with `expectedVersion`. |
| `PUT` | `/api/quote-requests/{id}/status` | Change business status with `expectedVersion`; closure requires a reason. |
| `GET` | `/api/quote-requests/{id}/quotations` | List every linked quotation. |
| `POST` | `/api/quote-requests/{id}/quotations` | Create a Catalog-priced proposal with `proposalRequestId` and `expectedVersion`. |

Expected business validation/conflict responses expose a controlled French reason
in Problem Details `detail`; unexpected technical exception messages stay hidden.
Import failures include `externalId`, stable `code` and a user-facing `reason`,
without echoing submitted contact details or remote error bodies.

These routes are registered unconditionally. `SUPABASE_ENABLED` controls remote
inbox access only; there is no QuoteRequest activation flag. Authentication and
authorization remain external deployment responsibilities. Current import logging
includes full Supabase rows; review the
[security prerequisites](../docs/integration/quote-request-implementation.md#sécurité--protections-à-vérifier-avant-exposition)
before using personal data. Responses use `Cache-Control: no-store`, which does
not provide access control.

### Invoice Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/invoices` | Create or retrieve an invoice from orderId. |
| `GET` | `/api/invoices?status=` | List invoices, optionally filtered by status. |
| `GET` | `/api/invoices/{invoiceId}` | Retrieve an invoice. |
| `PUT` | `/api/invoices/{invoiceId}` | Update editable draft fields. |
| `POST` | `/api/invoices/{invoiceId}/issue` | Issue and number an invoice. |
| `POST` | `/api/invoices/{invoiceId}/cancel` | Cancel an invoice. |
| `GET` | `/api/invoices/{invoiceId}/pdf` | Download a final invoice PDF. |

## Supabase Integration

The API accesses Supabase through server-side PostgREST adapters. Enable it with
`SUPABASE_ENABLED=true`, a project URL, and a service-role key. The key must never
reach Admin or public clients. Supabase schema/RLS setup is documented in the
[Supabase README](../supabase/README.md).

### Catalog projection

Explicit publish operations upsert `published_catalog_products`; unpublish
removes the selected product's projection. Published data includes customer
content, availability, images, active purchase modes/choices/ingredients, and
CAD prices in cents. Common BOM composition, internal costs, margins, and price
recommendations stay private. Optional choice/ingredient BOM UUIDs remain in the
projection. PostgreSQL remains the source of truth.

### Customer-order inbox

`POST /api/orders/import` is the only trigger: no webhook, scheduler, or polling
loop runs imports. It fetches `customer_orders` with `sync_status=pending` in
creation order. Each row is handled independently:

1. Persist a normalized local order, or recognize its existing source/external UUID.
2. Mark the source `synced` after local persistence.
3. On an import failure, attempt to mark the source `failed` with its error.

An acknowledgement failure leaves the local order intact. A later manual run
can acknowledge a still-pending row without duplicating it. Failed source rows
require review and reset to `pending` before retry. The import response reports
local-import and acknowledgement failures separately. With Supabase disabled,
local business operations remain available, but publication and import are rejected.

### Quote-request inbox

`POST /api/quote-requests/import` reads at most 100 pending rows, ordered by
`created_at,id`, and validates them individually. Local uniqueness on
`(source,external_id)` and a canonical payload fingerprint prevent duplicate or
contradictory imports. Each local transaction completes before the Supabase
acknowledgement. An acknowledgement retry preserves qualification and history.
The response separates invalid imports from acknowledgement failures and returns
stable error codes. Rows marked `failed` require privileged review/reset.

Supabase tracks `sync_status`, `synced_at` and `sync_error` independently from its
public business `status`. `SUPABASE_ENABLED=false` or an unavailable/missing inbox
schema makes the import return 503; local request consultation and qualification
remain available. The service-role key stays exclusively in this backend.

## RabbitMQ Contracts

The application declares durable classic queues and uses Jackson JSON message
conversion. Request bindings use the durable direct exchange
`savis.offer.requests.exchange` and routing key `savis.offer.requests`.
Results and invalidations are consumed from their queues by Supply listeners.
The listener factory uses the default automatic acknowledgement mode and
`defaultRequeueRejected=false`; failures are not requeued indefinitely. No
API-side dead-letter queue or retry policy is declared by these configurations.

### Component Requests

Queue: `savis.offer.requests`

Retained request contract; BOM saves no longer publish it:

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

## Persistence

PostgreSQL data is stored in the `savis_api` schema.

Main tables:

- `resources`;
- `boms`;
- `bom_components`;
- `bom_activities`;
- `activity_rates`;
- `offers`;
- `catalog_products`;
- `catalog_product_boms`;
- `catalog_product_purchase_modes`;
- `catalog_product_choice_groups`;
- `catalog_product_choice_options`;
- `catalog_product_ingredient_options`;
- `orders`;
- `order_items`;
- `order_item_choice_selections`;
- `order_item_choice_allocations`;
- `order_item_ingredient_selections`;
- `quote_requests` (immutable original JSONB, separate qualification, history and version);
- `quotations` (item snapshots in JSONB and optional request origin);
- `invoices` (item snapshots in JSONB);
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
- quotation and invoice item snapshots are JSONB; their entities carry optimistic
  versions, while conversion/issuance workflows also lock the relevant rows;
- invoices enforce a unique source order and invoice number;
- web orders are unique by `(source, external_order_id)` and retain their raw
  Supabase row as JSONB for audit.

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

The Flyway chain runs from V1 through V16, including orders (V5–V6), quotations
(V8), invoices (V9), resources (V11), BOM-resource links (V12), offer-resource
links (V13), QuoteRequest reception (V14), qualification/history/version (V15),
and the 1:N proposal link with persistent idempotency keys (V16). Add forward
migrations rather than editing applied SQL.

For Resource-link migration checks, see the
[Business Reference](../docs/SAVIS_API_BUSINESS_REFERENCE.md#resource-backed-bom-components)
and [V13 migration](src/main/resources/db/migration/V13__link_supply_offers_to_resources.sql).
Validate migrations on a restored staging database before production use.

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
| `SUPABASE_ENABLED`           | `false`                                       | Enable Supabase publication and manual order import. |
| `SUPABASE_URL`               | empty                                         | Supabase project URL.                |
| `SUPABASE_SERVICE_ROLE_KEY`  | empty                                         | Supabase service-role credential.    |

Messaging properties (overridable with Spring configuration):

| Property | Default |
| --- | --- |
| `savis.offer.request.queue` | `savis.offer.requests` |
| `savis.offer.request.exchange` | `savis.offer.requests.exchange` |
| `savis.offer.result.queue` | `savis.offer.results` |
| `savis.offer.invalidation.queue` | `savis.offer.invalidations` |
| `savis.offer.listener.auto-startup` | `true` |

`SERVER_PORT` overrides the HTTP port (default `8080`). Supabase values are
required only when the integration is enabled.

Additional runtime settings:

- Spring MVC Problem Details is enabled;
- virtual threads are enabled;
- Hibernate SQL logging is disabled;
- no application-level CORS configuration, authentication, or authorization is
  currently defined; Admin normally accesses the API through its proxy.

## Technology

- Java 25
- Spring Boot 4.1.2
- Spring Modulith 2.1.0
- Spring MVC
- Spring Data JPA and Hibernate
- Flyway
- Spring AMQP
- PostgreSQL
- H2 for tests
- Springdoc OpenAPI
- MapStruct annotation processing
- Lombok
- Thymeleaf and OpenHTMLToPDF for PDF documents
- libphonenumber for customer phone normalization
- JUnit 5, Mockito, and WireMock

## Local Development

Requirements:

- Java 25;
- PostgreSQL;
- RabbitMQ.

For standalone development against Compose PostgreSQL, configure the JDBC URL
`SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/savis` and provide
`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`,
`SPRING_RABBITMQ_USERNAME`, and `SPRING_RABBITMQ_PASSWORD` with local values.
The root `.env.local` is consumed by Compose; standalone Maven does not load it
automatically. The Supabase service-role key belongs in backend configuration only.

Run the application:

```bash
./mvnw spring-boot:run
```

Build the executable JAR:

```bash
./mvnw clean package
```

Run these commands from `savis-api/`. PostgreSQL and RabbitMQ must be reachable.
The API starts at `http://localhost:8080`; Flyway runs during startup.

To run the complete SAVIS environment from the repository root:

```bash
make run-local
```

## Docker

The [Dockerfile](Dockerfile) provides:

- `development`: Maven with Java 25 and `spring-boot:run`;
- `build`: executable JAR packaging without tests;
- `production`: a non-root Java 25 runtime image exposing port `8080`, with a
  readiness health check at `/actuator/health/readiness`.

Production Compose supplies database, broker, and optional Supabase settings to
`backend_api`. Container startup, migration order, and deployment health checks
are maintained with the root [deployment documentation](../README.md#production-deployment).

## Health and Operations

Actuator exposes `health` and `info` on the API port:

| Path | Purpose |
| --- | --- |
| `/actuator/health` | Aggregate application health. |
| `/actuator/health/liveness` | Process liveness probe. |
| `/actuator/health/readiness` | Readiness probe used by the Docker health check. |

No custom readiness group that explicitly includes PostgreSQL or RabbitMQ is
configured. Use aggregate health and service logs when diagnosing dependency
failures; the readiness probe alone does not establish end-to-end integration health.

For a local Compose deployment, run from the repository root:

```bash
docker compose logs -f backend_api
curl --fail http://localhost:8080/actuator/health
```

Flyway errors occur during startup, before Hibernate validation. Investigate the
failed migration and source data; do not conceal checksum mismatches with repair
or rewrite an applied migration. Production startup and recovery procedures are
in [Production Commands](../deploy/PRODUCTION_COMMANDS.md).

## Tests

From `savis-api/`, run the complete suite with `./mvnw test`.
The test profile uses H2 in PostgreSQL mode with `ddl-auto=create-drop`, disables
Flyway, and stops Supply listeners from consuming RabbitMQ. Most tests therefore
do not require the running stack. WireMock covers external HTTP adapters.

The test suite covers:

- common value objects and unit conversion;
- BOM domain validation, DTO mapping, component pricing, and service behavior;
- activity-rate workflows;
- Supply offer processing, messaging, and configuration;
- Product BOM validation and persistence reconciliation;
- product creation, update, configuration pricing, and worst-case pricing;
- catalog publication and Supabase requests;
- published projection mapping;
- Resource search, batching, and persistence;
- order snapshots, inbox import, lifecycle, and sourcing reports;
- quotation lifecycle, conversion, persistence, HTTP, and PDF rendering;
- invoice lifecycle, concurrency, migrations, persistence, HTTP, and PDF rendering;
- Spring context startup with H2;
- Spring Modulith boundary verification.

Useful targeted checks:

```bash
./mvnw -Dtest=BomTest,BomDtoTest,MinuteTest,ActivityRateServiceTest,BomServiceTest test
./mvnw -Dtest=OfferServiceTest,OffersListenerTest,SpringSupplyConfigTest test
./mvnw -Dtest=QuotationServiceTest,InvoiceServiceTest,InvoiceConcurrencyTest test
./mvnw -Dtest=ProductBomTest,ProductServiceTest,ProductPricingServiceTest test
./mvnw -Dtest=CatalogPublicationServiceTest,SupabaseCatalogAdapterTest,SavisApiModularityTests test
```

PostgreSQL-specific Resource migration tests are conditional and are skipped
unless `BOM_MIGRATION_TEST_URL` or `SUPPLY_MIGRATION_TEST_URL` is provided.
Use an isolated empty PostgreSQL database with the test credentials
`postgres`/`postgres`, never business data. The BOM setup example is in the
[Business Reference](../docs/SAVIS_API_BUSINESS_REFERENCE.md#resource-backed-bom-components).
For Supply, set `SUPPLY_MIGRATION_TEST_URL` and run
`./mvnw -Dtest=SupplyResourceMigrationTest test` against the same kind of isolated
database. H2 tests alone do not validate the full PostgreSQL migration chain.

For container-level Flyway/Alembic integration verification, run
`make smoke-database` from the repository root when Docker is available.

## Further Documentation

- [Business formulas and migration procedures](../docs/SAVIS_API_BUSINESS_REFERENCE.md)
- [System architecture](../docs/ARCHITECTURE.md)
- [Supabase schema and public access](../supabase/README.md)
- [Local stack and production operations](../README.md)
