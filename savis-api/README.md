# SAVIS API

**SAVIS API** is the Java/Spring Boot business backend for [SAVIS](../README.md).

It owns the BOM and supply domains, persists business data in PostgreSQL, exposes the admin-facing HTTP API, publishes component-needed messages, and consumes offer results from the executor through RabbitMQ.

## Main Slices

- `bom`: BOM management for food recipes and decoration/service assemblies.
- `supply`: persisted provider offers, RabbitMQ result consumption, offer invalidation, and offer search for the admin UI.
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
