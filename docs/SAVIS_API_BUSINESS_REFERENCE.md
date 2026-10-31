# Business Reference

Detailed rules, pricing formulas, and BOM-resource migration procedures for
SAVIS API. For a module overview, see the [SAVIS API README](../savis-api/README.md#business-slices).

## Navigation

- [Detailed module rules](#detailed-module-rules)
  - [BOM](#bom)
    - [BOM Cost](#bom-cost)
    - [Component Acquisition](#component-acquisition)
  - [Resource-backed BOM Components](#resource-backed-bom-components)
  - [Supply](#supply)
  - [Catalog](#catalog)
    - [Product BOM References](#product-bom-references)
    - [Product Cost](#product-cost)
    - [Pricing Analysis](#pricing-analysis)
    - [Product Categories and Subcategories](#product-categories-and-subcategories)
    - [Catalog Publication](#catalog-publication)
  - [Orders](#orders)
  - [Resource](#resource)
  - [Quotations](#quotations)
  - [Invoices](#invoices)

## Detailed module rules

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

BOM costing covers the existing component and activity scope only. Each line has
an explicit `KNOWN`, `MISSING`, or explicitly justified `NOT_APPLICABLE` status.
A known zero is valid; absent prices and rates are never inferred to be zero.

For each component, the BOM slice:

1. uses its selected offer when that UUID resolves and belongs to its resource;
2. otherwise searches for the cheapest available compatible offer of the same resource, retaining a
   `SELECTED_OFFER_NOT_FOUND` warning when a selected UUID no longer resolves;
3. prorates the package price to the requested component quantity.

A resolved selected offer marked unavailable retains its last observed price,
with a non-blocking `SELECTED_OFFER_UNAVAILABLE` warning and **no automatic
fallback**. This preserves the previous selection policy. A selected offer with
missing price, invalid package, incompatible units, or another resource produces a missing line,
without switching supplier silently. If no usable fallback exists, `OFFER_NOT_FOUND`
explains that no available compatible priced package was found. Unexpected
technical failures propagate as errors, rather than incomplete valuations.

```text
component consumption cost = package price * requested base quantity / package base quantity
activity cost = minutes / 60 * global hourly rate
known subtotal = sum of known component and activity costs
```

Consumption cost is not the budget for purchasing whole packages. Source data
include the selected and used offer UUIDs, observation date, package price and
size. Activity lines include the duration and hourly rate used. These are current
calculation responses, not persisted historical snapshots.

Missing activity rates produce `ACTIVITY_RATE_MISSING`; an explicitly configured
zero rate remains known. Activity semantics and the existing formula are
unchanged: **COOK may currently describe elapsed oven time, not human labor**.
Separating labor, equipment and energy is deferred to the Resource/equipment phase.

`GET /api/boms/{id}/price` now returns a structured `BomPricing` object, replacing
the former bare `Money` response. It contains `knownSubtotal`, `componentSubtotal`,
`activitySubtotal`, `components`, `activities`, `diagnostics`, `yieldQuantity`,
`complete`, and nullable `totalCost`. Each line carries its own diagnostics;
aggregate diagnostics retain their source and blocking/non-blocking distinction.
A non-positive yield produces `INVALID_YIELD`, preserves the known batch subtotal,
and prevents a complete valuation usable by Catalog.

`GET /api/boms` returns composition data only: it does not consult supplier
prices or activity rates, and does not calculate costs. The existing `price` and
`costing` DTO fields remain null for compatibility. Components and activities
remain available for search, cloning and Catalog's BOM selectors.

`GET /api/boms/{id}` includes the detailed result in `costing`; the legacy `price`
field contains only a complete total and is null for an incomplete BOM.
`GET /api/boms/{id}/price` remains available for explicit cost analysis.
The public `BomPricingApi` continues to serve Catalog without exposing internal
BOM objects. The former multi-BOM list calculation has been removed because the
list was its only consumer. Per-BOM `ComponentPricePort.getPrices` batching,
request deduplication and supplier lookup caches remain active for detail and
Catalog pricing, along with the activity-rate read for each BOM calculation.

#### Component Acquisition

BOM creation, replacement and component changes validate Resource references and
persist the aggregate only. They publish no acquisition events and enqueue no
scraping, even without offers. Cost reads use existing Supply offers only,
preserving selected offers, cheapest-compatible fallback and missing-price
diagnostics. Acquisition remains an explicit Executor task action or independent
scheduled maintenance.

### Resource-backed BOM Components

Each saved BOM component now carries a `resourceId` UUID, a quantity/unit, and
an optional selected offer UUID. The component row also keeps its resource name
as a display/acquisition snapshot. BOM pricing uses the resource UUID, with a
batched Supply lookup and strict selected-offer resource validation. BOM checks that
new references point to active resources and that units share the same base
unit (for example, `kg` and `g`). A component already attached to an inactive
resource remains readable and can be saved without changing that reference.

Flyway V12 groups legacy components by trimmed name with consecutive whitespace
collapsed and case ignored. It performs no synonym, accent or approximate matching.
Mass (`g`/`kg`) and volume (`ml`/`l`) are compatible within their dimension;
`piece` and legacy `portion` each form separate dimensions. Unknown units, blank
names and incompatible dimensions abort with the normalized name and component IDs.
A portion maps only to a Resource with no physical reference unit.

One existing resource with the same normalized name and compatible dimension is
reused without changing its UUID or metadata (including status). Multiple matches
or incompatible existing units abort with the matching UUIDs for explicit review.
Otherwise one resource is created with a deterministic UUID derived from the name,
and a base reference unit (`GRAM`, `MILLILITER`, `PIECE`, or null for portions).
All-material groups use `DECORATION_MATERIAL`; other physical groups use
`INGREDIENT`. Portions use `DECORATION_MATERIAL`. Names over 160 characters abort.
Component IDs, original names, quantities, units and selected offers stay unchanged;
no quantities are converted and pricing continues to use the original snapshots.

V12 was replaced during development with the user's confirmation that no retained
database has received it. Do not use Flyway repair to conceal a checksum mismatch
on another environment: stop and prepare a reviewed forward migration instead.
For production, back up the database, validate data and run the complete Flyway
chain on a restored staging copy first. Apply with application writers stopped.
A preflight failure rolls back the entire migration; correct the reported source
data explicitly and retry. Flyway history prevents replay after success.
No reset, deletion or automatic consolidation of pre-existing resources occurs.

Real PostgreSQL migration tests (use an isolated empty database, never business data):

```bash
docker run --rm -d --name savis-bom-migration-test \
  -e POSTGRES_PASSWORD=postgres -p 127.0.0.1:55439:5432 postgres:18.3-alpine
BOM_MIGRATION_TEST_URL=jdbc:postgresql://127.0.0.1:55439/postgres \
  ./mvnw -Dtest=BomResourceMigrationTest test
docker stop savis-bom-migration-test
```

Wait for PostgreSQL readiness before running Maven. The tests roll back each fixture
and its DDL. Run these tests explicitly against an isolated PostgreSQL database;
without the environment variable they are skipped, including in CI.

Post-migration integrity checks:

```sql
select count(*) as components_without_resource
from savis_api.bom_components where resource_id is null;

select count(*) as broken_resource_references
from savis_api.bom_components component
left join savis_api.resources resource on resource.public_id = component.resource_id
where resource.public_id is null;

-- Expected: no rows (multiple resources referenced for one component name).
select lower(trim(regexp_replace(component_name, '[[:space:]]+', ' ', 'g'))) as normalized_name,
       count(distinct resource_id) as resource_count,
       array_agg(distinct resource_id) as resource_ids
from savis_api.bom_components
group by 1 having count(distinct resource_id) > 1;

-- Also inspect duplicate names anywhere in the independent Resource catalog.
select lower(trim(regexp_replace(name, '[[:space:]]+', ' ', 'g'))) as normalized_name,
       count(*) as resource_count, array_agg(public_id order by public_id) as resource_ids
from savis_api.resources
group by 1 having count(*) > 1;
```

### Supply

The Supply slice stores the provider offers that SAVIS Executor has validated
and published.

An offer includes:

- public and provider product identifiers;
- component search term (acquisition metadata) and optional resource UUID;
- label, brand, image, and product URL;
- price and package size;
- provider identity;
- last-seen timestamp;
- availability status.

Incoming offers are reconciled first by public UUID, then by
`(externalId, provider.identifier)`. An invalidation marks the corresponding
offer unavailable instead of deleting it.

Automatic cheapest-offer searches expose only available offers; direct UUID lookup also exposes unavailable selected references with their availability. Searches are
case-insensitive and ordered by package price on the legacy name-search endpoint.
BOM pricing uses batched resource UUID lookup and compares normalized base-unit
prices. Supply validates manual associations using ResourceCatalogApi.

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

Commercial nature is independent from product configuration:

- `GOODS` identifies a physical good;
- `SERVICE` identifies a service sold through the same catalog and order flows.

Both commercial types may reference zero or more BOMs. Equipment rental and
other inputs used to deliver a service remain internal BOM costs; they are not
modeled as a third commercial product type.

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
- single choice cost without a selected mode: use a quantity of `1`;
- choice allocation: `commonCost + sum(choice unit cost * allocated quantity)`;
- ingredient customization:
  `commonCost + sum(extra unit cost * max(0, selected - default))`.

Default extras are not counted twice. Removing an ingredient below its default
quantity does not reduce the reference cost.

The conservative bundle analysis adds the common cost to the most expensive
active choice BOM multiplied by the selected mode quantity.

An analysis becomes `INCOMPLETE` when a required BOM UUID is absent, no longer
resolves, contains a missing component price or activity rate, has no valid cost,
or has a non-positive yield. This also covers a
common `ProductBom` deleted after product save. Missing UUIDs are returned when
known.

#### Pricing Analysis

Pricing analysis returns:

- analyzed quantity;
- selected sale price;
- `knownSubtotal`, plus nullable complete total `cost` and unit cost `unitCost`;
- source diagnostics propagated from BOM, including non-blocking warnings;
- actual and target margin;
- recommended price;
- completeness and missing BOM UUIDs;
- status: `GOOD`, `REVIEW`, `LOSS`, or `INCOMPLETE`.

The sale price comes from the selected active purchase mode. Without a mode
code, the default active mode is ordered by display order, label, then code.
Every product requires at least one active purchase mode. Product-level base
prices were removed in Flyway V2. Customizable ingredient prices are added only for
quantities above their defaults.

Recommended price:

```text
cost / (1 - target margin)
```

Incomplete analyses expose their known subtotal and diagnostics, but return null
for `cost`, `unitCost`, `actualMarginRate`, and `recommendedPrice`. Known BOM
subtotals are scaled by valid yields; an invalid yield cannot be used to convert
a batch subtotal into a product subtotal. For a worst-case bundle with an
incomplete candidate, the retained subtotal covers common BOMs only: no candidate
is asserted to be the maximum. A missing optional reference remains a business
diagnostic; unexpected technical exceptions are not caught as missing BOMs.

The recommendation is rounded upward to the next CAD 0.25. The recommendation is advisory and
never changes a product or purchase-mode sale price.

#### Product Categories and Subcategories

Every catalog product has a `ProductCategory` and may have one
`ProductSubcategory`. A subcategory declares its parent category in the domain,
and SAVIS rejects an incompatible association.

The initial public mappings are:

| API value | Public code | Parent category |
| --- | --- | --- |
| `DECORATIVE_ARCH` | `decorative-arch` | `DECORATION` |
| `CENTERPIECE` | `centerpiece` | `DECORATION` |
| `BIRTHDAY` | `birthday` | `DECORATION` |
| `WEDDING` | `wedding` | `DECORATION` |

The PostgreSQL and Supabase columns are nullable text columns without a
hardcoded value constraint. Adding a subcategory therefore requires updating
the domain/admin/storefront contracts, but does not require a Flyway or
Supabase schema migration.

#### Catalog Publication

`CatalogPublicationService.publishAll()` publishes products whose `published`
flag is true. Publication can be triggered:

- explicitly through the HTTP API.

When Supabase is disabled, publication returns a bad-request error.

The Supabase adapter upserts rows into:

```text
published_catalog_products
```

The public projection includes customer-facing product content, category,
optional subcategory public code, active purchase modes, active choices,
active ingredients, availability, images, and prices in cents. It excludes:

- common `productBoms`;
- internal costs and missing-BOM diagnostics;
- target margins;
- recommended prices.

Optional choice and ingredient `bom_id` values remain in the projection.
PostgreSQL remains the catalog system of record; Supabase is a read projection.

Bulk publication reads only products whose `published` flag is currently true.
It does not yet reconcile Supabase rows for products newly changed to
unpublished. Use the single-product HTTP unpublish endpoint to remove those rows.

### Orders

The Order slice owns the normalized local order aggregate, immutable item and
configuration snapshots, lifecycle transitions, administrative order entry,
and the manual external inbox import. Supabase `customer_orders.id` is stored
as `externalOrderId`; the local database additionally assigns a public UUID and
a sequence-backed order number.

Web imports are idempotent through the unique `(source, externalOrderId)` key.
The source row is retained as JSONB for audit. Successful local imports are
acknowledged in Supabase only after persistence completes.

### Resource

Resource owns the reference catalog for `INGREDIENT`, `CONSUMABLE`, `PACKAGING`,
`EQUIPMENT`, and `DECORATION_MATERIAL`. Resources are `ACTIVE` or `INACTIVE`;
historical references remain readable. Ingredients, consumables, and packaging
require a reference unit. Resource does not manage inventory or equipment scheduling.

### Quotations

The Quotation slice captures customer details, a required `validUntil` date,
Catalog-priced item/configuration snapshots, discount, and delivery fee.
Only `DRAFT` quotations can be edited. Allowed transitions are
`DRAFT → SENT`, then `SENT → ACCEPTED` or `SENT → REJECTED`.

Conversion requires an accepted quotation and is idempotent: repeated calls
return the same order UUID. It copies agreed snapshots without repricing against
Catalog and creates an `ACCEPTED` order with source `QUOTATION`. PDF generation
uses Thymeleaf and OpenHTMLToPDF. Supabase quote requests remain separate inbox
data; this module does not import them.

### Invoices

Invoice creation copies an order snapshot through `OrderInvoicingApi`.
Eligible order statuses are `ACCEPTED`, `IN_PREPARATION`, `READY`, and `COMPLETED`.
Order locking and a unique source-order constraint enforce one invoice per order.

New invoices are `DRAFT` without an invoice number. Draft updates allow customer
corrections, notes, discount, delivery fee, and explicit GST/QST amounts in cents;
item snapshots are preserved. Taxes start at zero and are not calculated from rates.
Issuing assigns a permanent sequence-backed number and freezes editable data.
Draft and issued invoices can be cancelled. Cancellation creates no credit note
and does not allow another invoice for the same order. Repeated issue/cancel
calls are idempotent in their respective target statuses.

Final PDF generation requires a previously issued invoice. An issued invoice
later cancelled remains documentable. Rendering uses persisted invoice data and
bundled fonts, without consulting current Catalog prices.

