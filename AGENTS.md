# SAVIS repository guidance

## Scope and sources of truth

- This is a monorepo for the SAVIS back office. Read the root `README.md` for
  setup and operational commands, and `docs/ARCHITECTURE.md` before changing a
  service boundary or cross-service flow.
- Each application has a detailed README. Keep the relevant README and
  architecture documentation synchronized when behavior, configuration,
  endpoints, messages, persistence, or operational procedures change.
- Treat build outputs and local state such as `node_modules/`, `dist/`,
  `coverage/`, `target/`, `.venv/`, `__pycache__/`, `.local/`, and
  `supabase/.temp/` as generated artifacts. Do not edit or commit them.
- Never commit credentials or generated environment files. In particular, the
  Supabase service-role key belongs only in trusted backend configuration and
  must never reach SAVIS Admin.

## System boundaries

- `savis-admin/` is a React/TypeScript client. It presents workflows but does
  not own business rules or persistence.
- `savis-api/` is the Spring Boot system of record for BOMs, supply projections,
  activity rates, catalog products, quotations, orders, and invoices. Its
  PostgreSQL schema is `savis_api`.
- `savis-executor/` owns provider acquisition, scraping, task execution, and
  offer review state. Its PostgreSQL schema is `savis_executor`.
- `supabase/` is the public catalog projection and the raw customer-submission
  inbox, not the SAVIS business backend.
- RabbitMQ carries offer requests, results, and invalidations between the API
  and Executor. Preserve queue names, payload compatibility, durability, and
  acknowledgement behavior when changing these contracts.
- Preserve data ownership. Do not bypass a service through its database, move
  provider-specific behavior outside Executor adapters, or let Admin query
  PostgreSQL, RabbitMQ, provider sites, or Supabase directly.

## General change discipline

- Make changes in the owning feature or business slice and keep transport,
  persistence, and vendor details at adapter boundaries.
- Prefer the existing vocabulary and public UUID contracts. Database primary
  keys in the Java API are internal `Long` values; cross-boundary identifiers
  are UUIDs.
- Add or update focused tests with behavior changes. Start with the smallest
  relevant test command, then run the full checks for every application that
  the change touches.
- When a change crosses applications, update and test both sides of the
  contract. Check HTTP DTOs, RabbitMQ payloads, enum values, nullability, and
  failure handling explicitly.
- User-facing Admin text and current business validation messages are in
  French. Follow the language and terminology already used in the affected
  feature.
- Use Conventional Commit-compatible semantics when preparing commit messages:
  `fix:` for patches, `feat:` for minor features, and `!` or
  `BREAKING CHANGE:` for breaking changes.

## SAVIS Admin (`savis-admin`)

- Use the feature-oriented layout under `src/features/<feature>/`: `api/`,
  `hooks/`, `model/`, `components/`, `pages/`, and feature-local types as
  appropriate. Put only genuinely cross-feature code in `src/shared/`.
- Prefer small, focused React components organized within their feature over
  large monolithic `.tsx` files.
- When a page or editor contains distinct sections, extract those sections and
  reusable field groups into named components. Keep page and editor containers
  focused on orchestration, state, and data flow.
- Follow the component organization already used in
  `savis-admin/src/features/bom` and
  `savis-admin/src/features/bom-component`.
- Use TanStack Query for server state, with stable feature-owned query keys and
  invalidation after successful mutations. Keep navigable list state such as
  pagination, filters, and sorting in URL search parameters.
- Use the shared Axios clients from `src/shared/api`; do not introduce direct
  backend or Supabase access from components. The normal proxy roots are
  `/savis-api` for the Java API and `/executor-api` for Executor.
- Reuse `src/shared/ui` primitives and the `@/` alias. Keep business-specific
  UI and hooks in their feature rather than expanding shared primitives.
- Mirror source paths under `test/` and use Vitest plus Testing Library for
  observable behavior. Avoid tests coupled to component internals.
- For frontend dependency changes, update both `package.json` and
  `package-lock.json`.

Frontend validation:

```bash
cd savis-admin
npm run lint
npm test -- --run
npm run build
```

Run one test while iterating with:

```bash
npm test -- --run test/path/to/file.test.tsx
```

## SAVIS API (`savis-api`)

- Keep each business slice organized into `domain`, `usecase`, `port`,
  `adapter`, and `config` packages. Domain and use-case code must not depend on
  web, JPA, RabbitMQ, Supabase, or PDF implementation details.
- Cross-module calls must use an explicit public API or a consuming module's
  port. Do not access another module's entities or repositories. In particular,
  catalog stores BOM UUIDs and consumes BOM pricing through its public
  contract; it does not create JPA relationships to BOM entities.
- Keep controllers and message listeners as translation boundaries. Put
  invariants and calculations in domain objects and workflow orchestration in
  use-case services.
- Preserve Spring Modulith named interfaces and run modularity verification
  after changing package visibility or dependencies between slices.
- Flyway owns the `savis_api` schema and Hibernate only validates it. Add a new
  ordered migration under `src/main/resources/db/migration` for schema changes;
  do not rely on Hibernate DDL generation or rewrite an applied migration.
- Tests use JUnit 5, Mockito, WireMock, and H2 in PostgreSQL compatibility mode.
  Place tests in the package matching the production code.

API validation:

```bash
cd savis-api
./mvnw test
```

## SAVIS Executor (`savis-executor`)

- Keep domain models, ports, and use cases under `app/core`; keep FastAPI,
  Celery, SQLAlchemy, RabbitMQ, browser, and provider details under
  `app/adapters`.
- Provider-specific selectors, parsing, blocking detection, and navigation
  belong in that provider's scraper adapter. Core workflows should depend only
  on provider ports.
- HTTP handlers and RabbitMQ subscribers must persist and enqueue slow work;
  they must not perform scraping inline.
- Preserve the single-worker browser model. Scraping tasks share one persistent
  external Chrome CDP session, so do not raise Celery concurrency without an
  explicit redesign of session and pacing behavior.
- Alembic owns the forward-only `savis_executor` schema. Add a new revision for
  schema changes and validate the complete migration chain; do not rewrite an
  applied revision.
- Manage dependencies with `uv`. Update `pyproject.toml` and `uv.lock`
  together, and keep the locked install reproducible.
- Ruff enables `ALL`. Prefer compliant code and use narrow, explained `noqa`
  suppressions only where the rule is genuinely inappropriate.

Executor validation:

```bash
cd savis-executor
uv run ruff check .
uv run pytest
uv run alembic upgrade head --sql >/dev/null
```

## Supabase, integration, and deployment

- Add timestamped, forward-only migrations under `supabase/migrations`; do not
  rewrite migrations that may already have been applied.
- Preserve RLS and least privilege. Public clients may call the intended RPCs
  but must not gain direct table access or privileged keys.
- Customer-order import is manual and idempotent. Preserve the local unique
  guard on `(source, external_order_id)` and the pending/synced/failed
  acknowledgement flow.
- Treat `docker-compose.yml`, `docker-compose.prod.yml`, `deploy/`, and
  `test/smoke/` as one operational contract when changing service names,
  health checks, ports, images, migrations, or startup ordering.
- Use the root smoke targets only when the affected integration warrants the
  required containers:

```bash
make smoke-executor-worker
make smoke-database
make smoke-admin
```

- For Supabase changes, start the local stack and run:

```bash
npx --yes supabase db lint --local --level warning
```

- `make clean` and `make restore-latest-prod-db` are destructive to local data.
  Do not run them unless the task explicitly requires that outcome.
