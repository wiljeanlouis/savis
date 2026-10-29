# Supply → Resource (phase 2.3)

## Ownership and implementation

`offers.resource_id` is a nullable public UUID, with a database foreign key but
no cross-module JPA relationship. Resource owns identity, name, category, unit
and status. Supply owns each offer's provider identity, URL, package, last price,
availability and observation time. `component_name` remains acquisition metadata
(the Executor search term), not the resource name. Manual offers use the fixed
acquisition label `Saisie manuelle`.

Executor owns provider review, acquisition tasks and refresh scheduling. Neither
Supply nor Executor currently has a separate price-history table: both store the
latest snapshot. This phase does not add a new historical pricing feature.
V13 changes only the resource association;
it neither deletes offers nor rewrites any existing column or Executor data.
RabbitMQ queues, payloads, acknowledgement and durability are unchanged.
Discovered offers are persisted unassociated, even if their name resembles a
resource. Operators validate the association from the Supply offer detail.
Refreshes preserve the Supply public UUID and validated resource UUID.

BOM passes its resource UUID, quantity and optional selected offer UUID. Supply's
public API loads all available offers for those resources plus all explicit
selections in one database query per valuation batch. BOM retains package
conversion, normalized cheapest-price selection, cost provenance and diagnostics.
An unavailable explicit selection keeps its last price. A missing selection falls
back; a selection belonging to another resource (including an unassociated offer)
blocks with `OFFER_RESOURCE_MISMATCH`, without silent fallback. No name-based
fallback is used for BOM or the Catalog valuation that consumes it.

Existing name-based Supply endpoints remain compatible for older consumers,
including order production sourcing. Migrating that separate report contract is
outside this phase; it must not be used for BOM cost valuation.

New manual offers and association changes require an existing ACTIVE resource
and a compatible reference/package unit dimension. Previously associated offers
remain priceable after a resource is deactivated, matching historical BOM pricing
behavior. Equipment/resources without reference units cannot receive priced offers
in this phase. Resource unit changes can make a package incompatible; BOM reports
the existing blocking unit diagnostic rather than converting dimensions.

## Pre-production validation

Do not apply V13 before reviewing production data on a restored, isolated copy.
V11 and V12 must already have succeeded. Run the read-only SQL in
`savis-api/scripts/supply-resource-preflight.sql`. It lists each offer, normalized
name and compatible resource candidates, including unmatched/incompatible offers.

- More than one compatible UUID: V13 aborts the entire migration. Correct master
  names/units or acquisition metadata explicitly after business review. Never
  create duplicate resources or choose a UUID arbitrarily.
- Exactly one compatible UUID: V13 reuses it, including an inactive resource for
  historical continuity. Compatibility means mass (g/kg), volume (ml/l), or piece.
- No compatible UUID: the offer remains NULL (`À associer`) with all original data.
  Create a genuinely missing resource through Resource, or associate an existing
  compatible resource explicitly in Admin after migration. A BOM using it has an
  incomplete cost until corrected; it never silently receives a zero price.

Normalization matches V12: trim, collapse whitespace, lowercase. Accents remain
significant. Unit symbols and enum names supported by the current Unit parser are
recognized. Distinct offers are never merged.

Before switching users, compare offer counts, public/provider IDs, packages,
prices, timestamps and availability to the restored snapshot; inspect selected
BOM offers whose resource differs from their component using
`savis-api/scripts/supply-resource-postflight.sql` (run after V13 on the restored
test copy). Validate representative BOM and Catalog valuations, including unavailable selections. Review all NULL
associations in Admin. Back up before applying the normal deployment procedure;
this phase does not deploy or change any production database.

## HTTP contracts

- `POST /api/supply/offers`: manual offer creation; resource UUID, provider name
  and identifier, external ID, price/currency and positive package required.
  Duplicate provider/external identity is rejected; association changes do not
  update prices or their observations.
- `PUT /api/supply/offers/{id}/resource`: `{ "resourceId": "UUID" }`;
  invalid, inactive, absent or incompatible resources return French HTTP 400.
- `GET /api/supply/offers/resource/{resourceId}?availableOnly=false`: associated
  offers, including unavailable ones by default; BOM selection uses `true`.
- Existing search/catalog DTOs add nullable `resourceId`; resource-list DTOs also
  expose availability. Existing name search is retained for compatibility.

## Verification

The PostgreSQL migration tests are opt-in and roll back fixtures and DDL:

```bash
cd savis-api
SUPPLY_MIGRATION_TEST_URL=jdbc:postgresql://localhost:55439/postgres \
  ./mvnw -Dtest=SupplyResourceMigrationTest test
```

Use a disposable empty database with test credentials `postgres`/`postgres`.
These tests verify ambiguity failure, unit disambiguation, unresolved offers and
exact preservation (compared as JSONB) of every pre-existing Supply column.

## Validation results (2026-10-29)

- API full suite: 213 tests discovered, 200 executed, zero failures/errors; the
  13 opt-in BOM migration tests were initially skipped. This includes the four
  real PostgreSQL Supply migration scenarios and both Spring Modulith checks.
  The 13 BOM migration tests were then run explicitly with
  `BOM_MIGRATION_TEST_URL=jdbc:postgresql://localhost:55439/postgres
  ./mvnw -Dtest=BomResourceMigrationTest test`: all 13 passed.
  In total, all 213 API tests were executed successfully.
- Admin: `npm run lint` and `npm run build` passed. Full Vitest suite passed:
  50 files, 175 tests (`npm test -- --run --maxWorkers=1`, default timeouts).
- PostgreSQL: complete SQL chain V1–V13 applied successfully on an empty
  disposable database. Both preflight and postflight queries executed successfully.
- `git diff --check` passed. Executor and Supabase were not modified; their
  application suites were not rerun. No live scraping or production-data
  migration was performed. Production-data review remains required above.

The final API/frontend test suites ran against temporary copies of the exact
application sources. Earlier runs in the shared workspace encountered missing
compiled Java classes and frontend timing failures during concurrent validation;
the isolated, sequential runs passed without changing test assertions/timeouts
for those timing failures. The legacy HTTP contract test was updated to accept
the newly exposed availability field. Build output still reports the existing
large JavaScript chunk advisory.

## Changed files

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [docs/SUPPLY_RESOURCE_MIGRATION.md](../docs/SUPPLY_RESOURCE_MIGRATION.md)
- [savis-admin/README.md](../savis-admin/README.md)
- [savis-admin/src/features/bom/api/supplyOfferApi.ts](../savis-admin/src/features/bom/api/supplyOfferApi.ts)
- [savis-admin/src/features/bom/components/BomComponentInput.tsx](../savis-admin/src/features/bom/components/BomComponentInput.tsx)
- [savis-admin/src/features/bom/hooks/useBomApi.ts](../savis-admin/src/features/bom/hooks/useBomApi.ts)
- [savis-admin/src/features/resource/components/ResourceOffersDialog.tsx](../savis-admin/src/features/resource/components/ResourceOffersDialog.tsx)
- [savis-admin/src/features/resource/pages/ResourcesPage.tsx](../savis-admin/src/features/resource/pages/ResourcesPage.tsx)
- [savis-admin/src/features/supply-offer/components/ManualOfferDialog.tsx](../savis-admin/src/features/supply-offer/components/ManualOfferDialog.tsx)
- [savis-admin/src/features/supply-offer/components/OfferResourceEditor.tsx](../savis-admin/src/features/supply-offer/components/OfferResourceEditor.tsx)
- [savis-admin/src/features/supply-offer/components/OfferResourceSearch.tsx](../savis-admin/src/features/supply-offer/components/OfferResourceSearch.tsx)
- [savis-admin/src/features/supply-offer/components/SupplyOfferDetailsDialog.tsx](../savis-admin/src/features/supply-offer/components/SupplyOfferDetailsDialog.tsx)
- [savis-admin/src/features/supply-offer/components/SupplyOffersTable.tsx](../savis-admin/src/features/supply-offer/components/SupplyOffersTable.tsx)
- [savis-admin/src/features/supply-offer/pages/SupplyOffersPage.tsx](../savis-admin/src/features/supply-offer/pages/SupplyOffersPage.tsx)
- [savis-admin/src/features/supply-offer/types.ts](../savis-admin/src/features/supply-offer/types.ts)
- [savis-admin/test/features/supply-offer/api/supplyOfferApi.test.ts](../savis-admin/test/features/supply-offer/api/supplyOfferApi.test.ts)
- [savis-admin/test/features/supply-offer/components/OfferResourceEditor.test.tsx](../savis-admin/test/features/supply-offer/components/OfferResourceEditor.test.tsx)
- [savis-admin/test/features/supply-offer/components/SupplyOffersTable.test.tsx](../savis-admin/test/features/supply-offer/components/SupplyOffersTable.test.tsx)
- [savis-admin/test/features/supply-offer/pages/SupplyOffersPage.test.tsx](../savis-admin/test/features/supply-offer/pages/SupplyOffersPage.test.tsx)
- [savis-api/README.md](../savis-api/README.md)
- [savis-api/scripts/supply-resource-postflight.sql](../savis-api/scripts/supply-resource-postflight.sql)
- [savis-api/scripts/supply-resource-preflight.sql](../savis-api/scripts/supply-resource-preflight.sql)
- [savis-api/src/main/java/com/savouretplus/savis/bom/adapter/external/ComponentPriceAdapter.java](../savis-api/src/main/java/com/savouretplus/savis/bom/adapter/external/ComponentPriceAdapter.java)
- [savis-api/src/main/java/com/savouretplus/savis/bom/domain/Bom.java](../savis-api/src/main/java/com/savouretplus/savis/bom/domain/Bom.java)
- [savis-api/src/main/java/com/savouretplus/savis/bom/port/ComponentPriceRequest.java](../savis-api/src/main/java/com/savouretplus/savis/bom/port/ComponentPriceRequest.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/adapter/persistence/OfferEntity.java](../savis-api/src/main/java/com/savouretplus/savis/supply/adapter/persistence/OfferEntity.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/adapter/persistence/OfferJpaRepository.java](../savis-api/src/main/java/com/savouretplus/savis/supply/adapter/persistence/OfferJpaRepository.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/adapter/persistence/OfferRepositoryAdapter.java](../savis-api/src/main/java/com/savouretplus/savis/supply/adapter/persistence/OfferRepositoryAdapter.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferCatalogResponse.java](../savis-api/src/main/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferCatalogResponse.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferController.java](../savis-api/src/main/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferController.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferDto.java](../savis-api/src/main/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferDto.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/api/OfferPricing.java](../savis-api/src/main/java/com/savouretplus/savis/supply/api/OfferPricing.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/api/SupplyApi.java](../savis-api/src/main/java/com/savouretplus/savis/supply/api/SupplyApi.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/domain/Offer.java](../savis-api/src/main/java/com/savouretplus/savis/supply/domain/Offer.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/port/OfferRepository.java](../savis-api/src/main/java/com/savouretplus/savis/supply/port/OfferRepository.java)
- [savis-api/src/main/java/com/savouretplus/savis/supply/usecase/OfferService.java](../savis-api/src/main/java/com/savouretplus/savis/supply/usecase/OfferService.java)
- [savis-api/src/main/resources/db/migration/V13__link_supply_offers_to_resources.sql](../savis-api/src/main/resources/db/migration/V13__link_supply_offers_to_resources.sql)
- [savis-api/src/test/java/com/savouretplus/savis/bom/adapter/external/ComponentPriceAdapterTest.java](../savis-api/src/test/java/com/savouretplus/savis/bom/adapter/external/ComponentPriceAdapterTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/supply/adapter/persistence/OfferRepositoryAdapterParameterTest.java](../savis-api/src/test/java/com/savouretplus/savis/supply/adapter/persistence/OfferRepositoryAdapterParameterTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/supply/adapter/persistence/OfferRepositoryAdapterTest.java](../savis-api/src/test/java/com/savouretplus/savis/supply/adapter/persistence/OfferRepositoryAdapterTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/supply/adapter/persistence/SupplyResourceMigrationTest.java](../savis-api/src/test/java/com/savouretplus/savis/supply/adapter/persistence/SupplyResourceMigrationTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferControllerTest.java](../savis-api/src/test/java/com/savouretplus/savis/supply/adapter/web/SupplyOfferControllerTest.java)
- [savis-api/src/test/java/com/savouretplus/savis/supply/usecase/OfferServiceTest.java](../savis-api/src/test/java/com/savouretplus/savis/supply/usecase/OfferServiceTest.java)
