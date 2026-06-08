# SAVIS API

**SAVIS API** is the Java/Spring Boot business backend for [SAVIS](../README.md).

It owns the BOM, supply, and catalog domains, persists business data in
PostgreSQL, exposes the admin-facing HTTP API, publishes component-needed
messages, consumes offer results from the executor through RabbitMQ, and
publishes a customer-facing catalog projection to Supabase.

## Main Slices

- `bom`: BOM management for food recipes and decoration/service assemblies.
- `supply`: persisted provider offers, RabbitMQ result consumption, offer invalidation, and offer search for the admin UI.
- `catalog`: product categories, sellable products, pricing analysis, and catalog publication.
- `common`: shared value objects such as `Money`, `Quantity`, and `Unit`.

## BOM Model

A BOM contains:

- components (`componentName`, `quantity`, `unit`, optional `selectedOfferId`);
- activities (`type`, `minutes`, `sequence`);
- activity rates (`activityType`, `hourlyRate`) configured globally per activity type;
- yield (`quantity`, `unit`);
- type (`FOOD`, `DECORATION`, etc. as defined by the domain).

The old recipe-specific timing fields have been replaced by activities. Unit payloads and persistence use symbols such as `g`, `kg`, `l`, `ml`, `piece`, and `portion`.

## HTTP API

### BOMs

- `POST /api/boms`: create or update a BOM.
- `GET /api/boms`: list BOMs.
- `GET /api/boms/{bomId}`: get one BOM.
- `GET /api/boms/{bomId}/price`: calculate one BOM total cost.
- `DELETE /api/boms/{bomId}`: delete one BOM.

### Activity Rates

- `POST /api/activity-rates`: create one hourly activity rate.
- `GET /api/activity-rates`: list configured activity rates.
- `GET /api/activity-rates/{activityType}`: get one activity rate.
- `PUT /api/activity-rates/{activityType}`: update one activity rate.
- `DELETE /api/activity-rates/{activityType}`: delete one activity rate.

Example payload:

```json
{
  "activityType": "PREP",
  "hourlyRate": {
    "amount": 60,
    "currency": "CAD"
  }
}
```

Only one `ActivityRate` can exist for a given `ActivityType`. Activities do not store hourly rates; their costs are calculated from the global rate:

```text
(minutes / 60) * hourlyRate
```

The BOM total cost is:

```text
sum(component costs) + sum(activity costs)
```

### Catalog Products

- `GET /api/catalog/products`: list products.
- `GET /api/catalog/products/{productId}`: get one product.
- `POST /api/catalog/products`: create a product.
- `PUT /api/catalog/products/{productId}`: update a product.
- `DELETE /api/catalog/products/{productId}`: delete a product.
- `POST /api/catalog/products/{productId}/pricing-analysis`: analyze one selected configuration.
- `GET /api/catalog/products/{productId}/worst-case-pricing?purchaseModeCode=...`: analyze a composable bundle's conservative worst case.
- `POST /api/catalog/products/publish`: publish all products marked for publication.

A product owns an ordered `productBoms` collection:

```json
{
  "id": null,
  "bomId": "4a7a05f4-c5f6-4e9e-a11d-855a349f5300",
  "quantity": 1.5,
  "displayOrder": 0
}
```

`ProductBom` contains a public UUID, a BOM UUID, a strictly positive decimal
quantity, and a non-negative display order. The collection may be empty.
Create and update reject any `ProductBom.bomId` that does not currently exist.
Catalog performs this check through `BomPricingPort` and the BOM module's
public `BomPricingApi`; it does not access BOM entities or repositories.

Choice and ingredient option `bomId` values remain optional and are not
validated during product save. They represent customer-specific costs rather
than common product costs.

Product cost is calculated from BOM unit cost:

```text
unitCost(bomId) = BOM total cost / BOM yield quantity
```

The supported rules are:

- standard: sum of common `ProductBom` costs;
- single choice: common cost plus the selected choice cost multiplied by the selected purchase-mode quantity, or `1` without a mode;
- choice allocation: common cost plus each choice cost multiplied by its allocated quantity;
- ingredient customization: common cost plus quantities selected above each ingredient's default quantity.

Default extras are not counted twice, and removing an ingredient does not
reduce the reference cost. If a required BOM is absent, deleted after product
save, or cannot produce a valid cost/yield, the pricing analysis is
`INCOMPLETE` and reports the missing BOM identifiers. Recommended prices are
advisory and never update product or purchase-mode prices.

### Product Categories

- `GET /api/catalog/categories`: list categories.
- `POST /api/catalog/categories`: create a category.
- `PUT /api/catalog/categories/{categoryId}`: update a category.
- `DELETE /api/catalog/categories/{categoryId}`: delete a category.

### Catalog Publication

`CatalogPublicationService` publishes products whose `published` flag is true.
Publication can be triggered through the HTTP endpoint or by the
`savis.catalog.refresh-cron` schedule. When Supabase publication is disabled,
the scheduled job is skipped and explicit publication is rejected.

The public projection contains customer-facing content, active purchase modes,
choices, ingredients, and prices in cents. It deliberately excludes:

- common `productBoms`;
- internal costs and missing-BOM diagnostics;
- target margins and recommended prices.

Choice and ingredient `bom_id` values remain in the projection when present.
Supabase is a read projection; PostgreSQL managed by SAVIS remains the product
system of record.

### Supply Offers

- `GET /api/supply/offers?componentName={name}`: search persisted available offers for a BOM component.

The supply offer response includes the offer id, product name fields, image URL, provider, price, package size, and URL data needed by the admin UI. The full product URL is built by combining the provider site with the offer URL.

## Messaging

The BOM slice publishes component-needed messages for BOM components after a BOM is saved. The executor decides whether a provider collection task is needed, based on whether all configured providers already have offers for the component name and BOM type.

Queues used by the Java API:

- `savis.offer.requests`: component/search requests sent to the executor.
- `savis.offer.results`: offer results consumed from the executor.
- `savis.offer.invalidations`: invalidation events consumed from the executor.

`OffersListener` uses a listener container configured with JSON conversion and `defaultRequeueRejected=false` to avoid infinite redelivery loops for malformed messages.

## Persistence Notes

- BOM components are persisted in `bom_components`.
- Activities are persisted in `bom_activities`.
- Both use `bom_id` as the join column.
- Activity rates are persisted in `activity_rates`, with one row per `ActivityType`.
- Supply offers are upserted by public id or by `(externalId, provider.identifier)`.
- `Unit` values are persisted as symbols, not enum names.
- Catalog data is relational: `catalog_products`,
  `catalog_product_categories`, `catalog_product_boms`,
  `catalog_product_purchase_modes`, `catalog_product_choice_groups`,
  `catalog_product_choice_options`, and
  `catalog_product_ingredient_options`.
- Catalog child collections use cascade and orphan removal. BOM identifiers are
  plain UUID columns, not JPA relationships to the BOM module.
- The application currently uses `spring.jpa.hibernate.ddl-auto=update`; there
  are no Flyway migrations for the Java-owned schema.
- Tests use H2 in PostgreSQL compatibility mode with `ddl-auto=create-drop`.

## Development

```bash
./mvnw test
./mvnw spring-boot:run
```

Useful targeted checks:

```bash
./mvnw -Dtest=BomTest,BomDtoTest,MinuteTest,ActivityRateServiceTest,BomServiceTest test
./mvnw -Dtest=OfferServiceTest,OffersListenerTest,SpringSupplyConfigTest test
```
