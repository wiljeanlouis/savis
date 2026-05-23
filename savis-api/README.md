# SAVIS API

**SAVIS API** is the Java/Spring Boot business backend for [SAVIS](../README.md).

It owns the BOM and supply domains, persists business data in PostgreSQL, exposes the admin-facing HTTP API, publishes component-needed messages, and consumes offer results from the executor through RabbitMQ.

## Main Slices

- `bom`: BOM management for food recipes and decoration/service assemblies.
- `supply`: persisted provider offers, RabbitMQ result consumption, offer invalidation, and offer search for the admin UI.
- `common`: shared value objects such as `Money`, `Quantity`, `Unit`, and `ActivityType`.

## BOM Model

A BOM contains:

- components (`componentName`, `quantity`, `unit`, optional `selectedOfferId`);
- activities (`type`, `minutes`, `sequence`);
- yield (`quantity`, `unit`);
- type (`FOOD`, `DECORATION`, etc. as defined by the domain).

The old recipe-specific timing fields have been replaced by activities. Unit payloads and persistence use symbols such as `g`, `kg`, `l`, `ml`, `piece`, and `portion`.

## HTTP API

### BOMs

- `POST /api/boms`: create or update a BOM.
- `GET /api/boms`: list BOMs.
- `GET /api/boms/{bomId}`: get one BOM.
- `DELETE /api/boms/{bomId}`: delete one BOM.

### Supply Offers

- `GET /api/supply/offers?componentName={name}`: search persisted available offers for a BOM component.

The supply offer response includes the offer id, product name fields, image URL, provider, price, package size, and URL data needed by the admin UI. The full product URL is built by combining the provider site with the offer URL.

## Messaging

The BOM slice publishes component-needed messages when a BOM component has no `selectedOfferId`.

Queues used by the Java API:

- `savis.offer.requests`: component/search requests sent to the executor.
- `savis.offer.results`: offer results consumed from the executor.
- `savis.offer.invalidations`: invalidation events consumed from the executor.

`OffersListener` uses a listener container configured with JSON conversion and `defaultRequeueRejected=false` to avoid infinite redelivery loops for malformed messages.

## Persistence Notes

- BOM components are persisted in `bom_components`.
- Activities are persisted in `bom_activities`.
- Both use `bom_id` as the join column.
- Supply offers are upserted by public id or by `(externalId, provider.identifier)`.
- `Unit` values are persisted as symbols, not enum names.

## Development

```bash
./mvnw test
./mvnw spring-boot:run
```

Useful targeted checks:

```bash
./mvnw -Dtest=BomTest,BomDtoTest,MinuteTest test
./mvnw -Dtest=OfferServiceTest,OffersListenerTest,SpringSupplyConfigTest test
```
