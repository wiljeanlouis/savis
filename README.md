# SAVIS

Back-office information system for **SavouretPlus**.

SAVIS manages technical BOMs, provider offers, activity rates, product costs,
the sellable catalog, and publication to the customer-facing Supabase
projection.

> Detailed changes: [CHANGELOG.md](CHANGELOG.md)

## Navigation

- [SAVIS](#savis)
  - [Navigation](#navigation)
  - [Overview](#overview)
  - [Applications](#applications)
    - [SAVIS Admin](#savis-admin)
    - [SAVIS API](#savis-api)
    - [SAVIS Executor](#savis-executor)
  - [Quick Start](#quick-start)
    - [Prerequisites](#prerequisites)
    - [1. Configure Local Credentials](#1-configure-local-credentials)
    - [2. Start the Complete Stack](#2-start-the-complete-stack)
    - [3. Follow the Logs](#3-follow-the-logs)
    - [4. Restore the Latest Production Database Backup](#4-restore-the-latest-production-database-backup)
  - [Local URLs](#local-urls)
  - [Architecture](#architecture)
  - [Repository Structure](#repository-structure)
  - [Development](#development)
    - [Admin](#admin)
    - [API](#api)
    - [Executor](#executor)
  - [Configuration](#configuration)
    - [Shared Compose Variables](#shared-compose-variables)
    - [Supabase Publication](#supabase-publication)
    - [Standalone Admin](#standalone-admin)
    - [Standalone Executor](#standalone-executor)
  - [Tests and Quality](#tests-and-quality)
  - [Docker and Health Checks](#docker-and-health-checks)
  - [Releases](#releases)
  - [Production Deployment](#production-deployment)
    - [Install Chrome CDP Services](#install-chrome-cdp-services)
    - [Production Environment](#production-environment)
    - [Production PostgreSQL Backups](#production-postgresql-backups)
    - [Deploy a Release Package](#deploy-a-release-package)
  - [Useful Commands](#useful-commands)
  - [Further Documentation](#further-documentation)

## Overview

SAVIS is composed of three deployable applications and a public data
projection:

| Component | Technology | Responsibility | Documentation |
| --- | --- | --- | --- |
| **SAVIS Admin** | React 19, TypeScript 6, Vite 8 | Internal management interface | [README](savis-admin/README.md) |
| **SAVIS API** | Java 25, Spring Boot 4.1 | Business rules and system of record | [README](savis-api/README.md) |
| **SAVIS Executor** | Python 3.14, FastAPI, Celery | Provider acquisition and background work | [README](savis-executor/README.md) |
| **Supabase** | PostgreSQL, RLS | Public catalog and commerce projection | [Migrations](supabase/migrations) |

Main capabilities:

- technical BOMs, components, activities, yields, and cost calculation;
- global activity-rate management;
- provider offer acquisition, review, selection, invalidation, and refresh;
- asynchronous tasks with retries, request pacing, and provider circuit
  breaking;
- product categories, purchase modes, customer choices, and customizable
  ingredients;
- product cost, margin, worst-case, and recommended-price analysis;
- explicit and scheduled catalog publication to Supabase;
- immutable Docker releases with SBOM and provenance metadata.

Supabase is not the SAVIS business backend. PostgreSQL schemas owned by the API
and Executor remain the system of record.

## Applications

### SAVIS Admin

The French-language administration UI provides:

- BOM and component management;
- offer review and acquisition-task monitoring;
- activity-rate configuration;
- catalog product editing and pricing analysis;
- catalog publication.

In production, Nginx serves the single-page application and proxies:

- `/savis-api/*` to SAVIS API;
- `/executor-api/*` to SAVIS Executor.

### SAVIS API

The Java application owns:

- BOM, supply, activity-rate, and catalog business rules;
- pricing and margin analysis;
- offer requests and result consumption through RabbitMQ;
- publication of customer-facing catalog data to Supabase.

Its PostgreSQL schema is `savis_api`. Flyway manages the schema and Hibernate
validates it at startup.

### SAVIS Executor

The Python application owns:

- FastAPI endpoints for offers and tasks;
- RabbitMQ request consumption and result publication;
- Celery workers and scheduled maintenance;
- Maxi provider extraction through Playwright and external Chrome CDP;
- request pacing and provider block cooldowns.

Its PostgreSQL schema is `savis_executor`, managed by Alembic. The worker uses
concurrency `1` because scraping tasks share one persistent Chrome session.

## Quick Start

### Prerequisites

- Docker Engine with Docker Compose;
- Node.js 24 and `npm`;
- Google Chrome on macOS for the local CDP session;
- optional for standalone development: Java 25, Python 3.14.4+, and `uv`.

The Makefile invokes the Supabase CLI through `npx`.

### 1. Configure Local Credentials

Create `.env.local` at the repository root:

```env
DB_USER=savis
DB_PASSWORD=change-me
DB_NAME=savis
RABBIT_MQ_USER=savis
RABBIT_MQ_PASSWORD=change-me
```

Do not commit real credentials. Root environment files are ignored by Git.

### 2. Start the Complete Stack

```bash
make run-local
```

This command:

1. starts a dedicated Chrome CDP session on macOS;
2. starts the local Supabase stack;
3. generates `.env.supabase.local` from the local Supabase credentials;
4. optionally configures the sibling `../savouretplus` checkout;
5. builds and starts SAVIS with the development Compose override.

To use another SavouretPlus checkout:

```bash
make run-local SAVOURETPLUS_DIR=/path/to/savouretplus
```

### 3. Follow the Logs

```bash
make logs
```

Stop everything with:

```bash
make stop
```

### 4. Restore the Latest Production Database Backup

Production backups are created on the server by `systemd` and uploaded to
Google Drive through `rclone`. To replace the local PostgreSQL database with
the latest production backup:

```bash
make restore-latest-prod-db
```

The command expects `rclone` to be configured locally and this variable to be
available in `.env.local` or `.env.supabase.local`:

```env
RCLONE_BACKUP_REMOTE=savis-gdrive:backups/postgres
```

The restore is destructive for the local development database. Downloaded
backup files are stored under `.local/backups/postgres/`, which is ignored by
Git.

## Local URLs

| Service | Development URL | Notes |
| --- | --- | --- |
| SAVIS Admin | <http://localhost:5173> | Vite development server |
| SAVIS API | <http://localhost:8080> | Spring Boot |
| API documentation | <http://localhost:8080/swagger-ui.html> | OpenAPI UI |
| Executor API | <http://localhost:8000> | FastAPI |
| Executor documentation | <http://localhost:8000/docs> | OpenAPI UI |
| RabbitMQ management | <http://localhost:15672> | Uses `.env.local` credentials |
| PostgreSQL | `localhost:5434` | Shared server, separate schemas |

The local production-style Admin image is served at <http://localhost> when
the development override is not active.

## Architecture

```text
SAVIS Admin --HTTP----------> SAVIS API
SAVIS Admin --HTTP----------> SAVIS Executor API

SAVIS API --requests-------> RabbitMQ -------> SAVIS Executor
SAVIS API <--results-------- RabbitMQ <------- SAVIS Executor

SAVIS API -----------------> PostgreSQL / savis_api
SAVIS Executor ------------> PostgreSQL / savis_executor
SAVIS Executor --CDP-------> External Google Chrome

SAVIS API --publication----> Supabase ----> SavouretPlus
```

Both backends use vertical slices and ports-and-adapters boundaries. Business
code does not depend directly on HTTP, persistence, messaging, or scraping
frameworks.

Important ownership rules:

- the API owns BOMs, prices, products, and the business state;
- the Executor owns acquisition tasks and provider-facing offer state;
- RabbitMQ carries offer requests, results, and invalidations;
- Supabase contains only the public projection;
- Catalog references BOMs by UUID through a public pricing contract, not JPA
  relationships.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed runtime flows,
module boundaries, and C4 views.

## Repository Structure

```text
savis/
|-- savis-admin/              # React administration UI
|-- savis-api/                # Spring Boot business API
|-- savis-executor/           # FastAPI, Celery, and provider adapters
|-- supabase/                 # Public projection migrations
|-- docs/                     # System architecture
|-- deploy/scripts/           # Production deployment automation
|-- deploy/systemd/           # Production systemd unit templates
|-- scripts/                  # Local development helpers
|-- test/smoke/               # Container smoke tests and Compose fixtures
|-- docker-compose.yml        # Local development stack
|-- docker-compose.prod.yml   # Immutable production stack
|-- Makefile
`-- CHANGELOG.md
```

## Development

### Admin

```bash
cd savis-admin
npm ci
npm run dev
```

Common commands:

```bash
npm run lint
npm test -- --run
npm run build
npm run format
```

### API

```bash
cd savis-api
./mvnw spring-boot:run
```

Run the test suite:

```bash
./mvnw test
```

### Executor

```bash
cd savis-executor
uv sync --frozen
uv run fastapi dev
```

Run quality checks:

```bash
uv run ruff check .
uv run pytest
uv run alembic upgrade head --sql >/dev/null
```

Provider scraping requires an accessible Chrome CDP endpoint. Start the macOS
session from the repository root:

```bash
make chrome-cdp-start
```

## Configuration

### Shared Compose Variables

```env
DB_USER=
DB_PASSWORD=
DB_NAME=
RABBIT_MQ_USER=
RABBIT_MQ_PASSWORD=
```

### Supabase Publication

```env
SUPABASE_ENABLED=false
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SAVIS_CATALOG_REFRESH_CRON=0 0 * * * *
```

`make run-local` generates the local Supabase values in
`.env.supabase.local`.

### Standalone Admin

```env
VITE_API_URL=http://localhost:8080/api
VITE_EXECUTOR_API_URL=http://localhost:8000/api
```

Without build-time variables, the production Admin defaults to the Nginx
proxies `/savis-api` and `/executor-api`.

### Standalone Executor

```env
RABBIT_MQ_URL=amqp://user:password@localhost:5672/%2f
DATABASE_URL=postgresql+psycopg://user:password@localhost:5434/savis
DATABASE_SCHEMA=savis_executor
BROWSER_CDP_URL=http://localhost:9222
PROVIDER_MIN_REQUEST_DELAY_SECONDS=60
PROVIDER_MAX_REQUEST_DELAY_SECONDS=600
PROVIDER_BLOCK_COOLDOWN_SECONDS=900,3600,21600,86400
PROVIDER_PROBE_TIMEOUT_SECONDS=1800
```

## Tests and Quality

Pull requests run `.github/workflows/ci.yml` on GitHub-hosted runners:

| Job | Checks |
| --- | --- |
| API Java | Maven tests |
| Executor Python | Locked install, Ruff, pytest, Alembic chain, container smoke tests |
| Admin frontend | Locked install, ESLint, Vitest, production build |
| Deployment definitions | Production Compose validation and Supabase migration lint |

Release Please pull requests skip duplicate component jobs because their source
commits have already passed CI. The release workflow invokes CI again before
publishing images.

## Docker and Health Checks

The runtime stack contains:

| Service | Purpose |
| --- | --- |
| `postgres` | Shared PostgreSQL server |
| `rabbitmq` | Event transport and Celery broker |
| `backend_api` | Spring Boot API |
| `executor_migrate` | One-shot Alembic migration |
| `executor_api` | FastAPI and RabbitMQ subscriber |
| `executor_worker` | Celery provider worker |
| `executor_beat` | Scheduled refresh and cleanup |
| `frontend_admin` | Nginx-hosted React application |

Production readiness checks:

- API: `/actuator/health/readiness`;
- Executor: `/health`, including PostgreSQL and RabbitMQ checks;
- Executor liveness: `/health/live`;
- Admin: `/health`;
- PostgreSQL: `pg_isready`;
- RabbitMQ: `rabbitmq-diagnostics ping`.

The deployment script requires API, Executor, and Admin containers to expose a
healthy Docker status. On failure, it prints service logs and recent health
check output.

## Releases

Release Please manages the version, changelog, release pull request, and
SemVer tag from Conventional Commits:

| Commit | Version impact |
| --- | --- |
| `fix:` | Patch |
| `feat:` | Minor |
| `feat!:` or `BREAKING CHANGE:` | Major |

When the release pull request is merged:

1. `CHANGELOG.md` and `version.txt` are updated;
2. a `vX.Y.Z` tag and GitHub Release are created;
3. `.github/workflows/release.yml` runs the full CI;
4. API, Admin, and Executor images are published to GHCR;
5. image digests, SBOMs, and BuildKit provenance are recorded;
6. a checksummed `savis-vX.Y.Z.tar.gz` deployment package is attached.

The release workflow can also republish an existing tag through
`workflow_dispatch` using its `release_tag` input.

## Production Deployment

The supported target is an Ubuntu host with:

- Docker Engine and Docker Compose;
- Google Chrome stable, `socat`, and a graphical session;
- access to the private GHCR images;
- a production environment file outside Git.

### Install Chrome CDP Services

From a graphical desktop terminal, as the deployment user:

```bash
./deploy/scripts/install-chrome-cdp-ubuntu.sh
```

Verify both user services and endpoints:

```bash
systemctl --user is-active savis-chrome-cdp.service
systemctl --user is-active savis-chrome-cdp-proxy.service
curl --fail http://127.0.0.1:9222/json/version
curl --fail http://127.0.0.1:9223/json/version
```

Port `9223` must be reachable by Docker but blocked from the public network.

### Production Environment

Store secrets in `/etc/savis/savis.env` or set `SAVIS_ENV_FILE`:

```env
DB_USER=
DB_PASSWORD=
DB_NAME=
RABBIT_MQ_USER=
RABBIT_MQ_PASSWORD=
BROWSER_CDP_URL=http://host.docker.internal:9223
SUPABASE_ENABLED=true
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
SAVIS_HTTP_BIND=127.0.0.1
SAVIS_HTTP_PORT=8088
RCLONE_BACKUP_REMOTE=savis-gdrive:backups/postgres
```

`SUPABASE_DB_URL` is required by deployment when publication is enabled.

### Production PostgreSQL Backups

Install and configure `rclone` for the deployment user on the Ubuntu host, then
run the backup script from the current release:

```bash
~/.local/share/savis/deploy/current/deploy/scripts/backup-postgres-production.sh
```

The script creates a compressed PostgreSQL custom-format `.dump`, uploads it to
`RCLONE_BACKUP_REMOTE`, verifies the remote file, keeps local backups for 7 days,
and keeps remote backups for 90 days. These defaults can be overridden:

```env
SAVIS_POSTGRES_BACKUP_DIR=/home/savis/.local/share/savis/deploy/backups/postgres
SAVIS_POSTGRES_BACKUP_LOCAL_RETENTION_DAYS=7
SAVIS_POSTGRES_BACKUP_REMOTE_RETENTION_DAYS=90
SAVIS_POSTGRES_BACKUP_MIN_FREE_KB=1048576
```

Install the provided systemd unit and timer:

```bash
sudo ./deploy/scripts/install-postgres-backup-systemd.sh
```

Check the timer and backup logs:

```bash
systemctl list-timers | grep savis
journalctl -u savis-postgres-backup.service -n 100 --no-pager
```

### Deploy a Release Package

After downloading and verifying a GitHub Release archive:

```bash
tar -xzf savis-v1.2.0.tar.gz
./savis-v1.2.0/deploy/scripts/deploy-production.sh ./savis-v1.2.0
```

The script:

1. validates the environment and immutable image digests;
2. verifies Chrome CDP and available disk space;
3. backs up PostgreSQL when it is already running;
4. pulls the release images;
5. applies Supabase migrations when enabled;
6. runs Alembic migrations;
7. starts services in dependency order and waits for health checks;
8. updates the `current` release symlink after success.

Production operation commands for CDP, backups, RabbitMQ, logs, health checks,
and deployment verification are collected in
[deploy/PRODUCTION_COMMANDS.md](deploy/PRODUCTION_COMMANDS.md).

Verify the deployment:

```bash
curl --fail http://127.0.0.1:8088/health
docker compose \
  --project-name savis \
  --env-file /etc/savis/savis.env \
  --env-file ~/.local/share/savis/deploy/current/release.env \
  -f ~/.local/share/savis/deploy/current/docker-compose.prod.yml \
  ps
```

## Useful Commands

| Command | Purpose |
| --- | --- |
| `make help` | List Make targets |
| `make run-local` | Start SAVIS and local Supabase |
| `make chrome-cdp-start` | Start Chrome CDP on macOS |
| `make logs` | Follow Compose logs |
| `make stop` | Stop SAVIS and Supabase |
| `make clean` | Remove SAVIS volumes and local Supabase data |
| `make restore-latest-prod-db` | Restore local PostgreSQL from the latest production backup |
| `make smoke-executor-worker` | Smoke test RabbitMQ and the Celery worker |
| `make smoke-database` | Smoke test PostgreSQL, Flyway, and Alembic |
| `make smoke-admin` | Smoke test the Admin Nginx image |
| `make supabase-status` | Show local Supabase URLs and keys |
| `make supabase-reset` | Rebuild the local Supabase database |

## Further Documentation

- [System architecture](docs/ARCHITECTURE.md)
- [SAVIS Admin](savis-admin/README.md)
- [SAVIS API](savis-api/README.md)
- [SAVIS Executor](savis-executor/README.md)
- [Changelog](CHANGELOG.md)
