# Production migrations and recovery

No production command in this document is run by CI tests. Deployments run
automatically. Never modify applied migrations, run `clean`, `reset`, `repair`,
`downgrade`, or restore a database as part of ordinary deployment.

## Sequence and migration runners

`deploy-production.sh` validates the release, immutable digests, Compose,
dependencies, disk space (5 GiB), and Chrome. A host `flock` prevents concurrent
runs of this script. No per-release human migration approval or Supabase backup
attestation is required. Before migration, it automatically backs up the
existing Docker PostgreSQL database. It starts PostgreSQL/RabbitMQ and waits for
both to be healthy, then executes, in order:

1. Supabase CLI dry run and push, only with `SUPABASE_ENABLED=true`;
2. `compose run --rm --no-deps backend_migrate`;
3. `compose run --rm --no-deps executor_migrate`;
4. replacement of API and Executor API, then their readiness checks;
5. replacement of Worker, Beat, and Admin, then Worker/Admin health checks and
   a Beat process check;
6. final service state, then promotion of `current` and `current-version`.

The Java image accepts `migrate` as its sole argument. This directly calls the
Flyway library already packaged with Spring Boot, using the existing SQL and
fixed `savis_api` schema. It creates no Spring context, Tomcat, listeners,
schedulers, JPA, or business beans. An exception produces a failing JVM exit.
A separate Flyway CLI would require packaging a second executable and keeping
its dependency versions in sync; no such dependency is necessary here.
Normal production startup disables Flyway and uses Hibernate `validate`.
The `dev` Spring profile explicitly retains migrations for local development.

Alembic remains unchanged: `upgrade head`, its version table and historical
revisions target `savis_executor`. Neither runner resets or repairs history;
re-running a successful runner skips completed migrations. Both share a database
role with existing privileges: the schema setting is not a database permission
boundary. Review future SQL/Python for cross-schema writes.

The script uses `--no-deps` when replacing applications so Compose does not
recreate infrastructure or rerun migration dependencies. It does not use
`--remove-orphans`, stop old applications before migrations, or restore data.
On a fresh installation without a PostgreSQL container, explicitly verify that
there is no existing database requiring backup, then set `SAVIS_INITIAL_INSTALL=true`.
A previous validated release with no PostgreSQL container always blocks deployment.
An existing stopped PostgreSQL container must first be recovered and backed up.

## Automated migrations and warnings

The pipeline is noninteractive. It does not require
`SAVIS_MIGRATIONS_APPROVED_FOR`, `SUPABASE_BACKUP_VERIFIED_FOR`, or
`SUPABASE_BACKUP_REFERENCE`, and it does not calculate an approval token.
Technical errors remain blocking: invalid configuration, a failed or empty
PostgreSQL backup, failed dry run or migration, and unsatisfied health checks
stop deployment. The host `flock` still prevents concurrent deployments.

Supabase CLI is pinned to **3.0.0** in CI and production. Hosted pushes use
`--remote=<URL> --yes --skip-vault`; `npx --yes` and CLI `--yes` keep execution
noninteractive. Every enabled Supabase deployment performs the CLI dry run
before applying changes. No seed or role deployment is enabled, and ordinary
pushes omit `--include-all` so backdated migrations are not silently forced
through production.

Before migration, the helper scans all packaged Supabase SQL files, including
historical files, for potential destructive operations (`DROP`, `TRUNCATE`,
`DELETE`, `UPDATE`, `ALTER`, `REVOKE`, and dynamic `EXECUTE`). Matches are
printed as warnings only; they do not require approval or block deployment.
This conservative text scan can report harmless operations and miss indirect
effects. It does not classify Flyway or Alembic migrations. The Supabase dry run,
migration exit status, automated PostgreSQL backup, and application health
checks remain technical gates.

## Supabase data and recovery risk

Supabase is not only a rebuildable catalog projection. Explicitly published
catalog data is projected from the SAVIS API/PostgreSQL and can be republished.
However, public storefronts also write data that originates only in Supabase:

- `public.customer_orders` receives raw customer order submissions. The API
  imports these only when an administrator triggers the import; until then,
  PostgreSQL SAVIS has no copy. After import, SAVIS stores a normalized order,
  which is not guaranteed to preserve every original payload field.
- `public.quote_requests` receives raw event quote requests. These are also
  imported manually into SAVIS; pending or failed submissions may exist only
  in Supabase. The private idempotency/replay ledger and acknowledgement fields
  (`sync_status`, `synced_at`, `sync_error`) are Supabase-owned operational data.
- Supabase-side notification state such as `notified_at`, where configured,
  is not part of the SAVIS PostgreSQL database.

Therefore the pre-migration Docker `pg_dump` protects the SAVIS API/Executor
database only; it does not back up Supabase. Hosted Supabase backups, retention,
PITR, and restore procedures must be managed separately as operational
protection, but their verification is not a deployment approval or gate.
Loss/restoration of Supabase can lose not-yet-imported customer submissions,
their original payloads, and inbox state. There is no automatic Supabase restore
or migration rollback.

## Expand and contract; rollback limitations

Add nullable columns/tables first, keep old reads/writes valid, deploy compatible
code, backfill separately, and add constraints only after data validation. Remove
old columns/functions/enum semantics in a later release after all consumers and
the desired rollback window have moved forward. Renames, required columns, type
changes, deletes and policy/function changes need explicit compatibility review.
Historical migrations (including destructive API V2/V3 and Supabase function or
policy replacements) remain untouched; applying a full chain to a fresh database
is different from applying pending changes while old applications serve traffic.

A failed migration stops the script before application replacement, retaining the
previous release markers. Earlier migration runners may already have committed;
even a failed runner can leave effects from nontransactional operations. The old
applications continue against that evolved database. A failure during application
replacement can leave mixed application versions. Collect the redacted diagnostics
and inspect migration histories before a manual retry or recovery decision.

To return to an older **application** release, use its immutable images only after
checking its compatibility against the **current** schemas. Running an older
deployment package can have older unsafe startup/migration behavior; review its
script before using it. Do not run an old Flyway chain blindly against newer
history. Returning to old images never restores data or schema. Prefer a forward
fix when compatibility is unclear; restoring Docker PostgreSQL or Supabase is a
separate data recovery operation that may lose intervening writes.

## Health checks and verification

`SAVIS_HEALTH_TIMEOUT_SECONDS` (default 600) and `SAVIS_HEALTH_POLL_SECONDS`
(default 5) must be positive integers. Missing containers are retried to the
deadline, inspection errors are explicit, exited/dead containers and missing
healthchecks fail, and temporary `unhealthy` states may recover. `running` alone
never satisfies PostgreSQL, RabbitMQ, API, Executor API, Worker, or Admin readiness.
Worker health uses Celery ping to its own node. Beat has no readiness endpoint;
its inherited HTTP healthcheck is disabled and only its process is checked.
That does not establish scheduler progress; operational monitoring remains needed.

Logs are captured in a private temporary file and redacted before display,
including connection URLs and configured secret values. Do not enable shell
tracing, Docker debug dumps, or log arbitrary application payloads with secrets.
Failure diagnostics include service state, bounded logs, and health results.
The `current` symlink replacement and version-file replacement are individually
atomic after health validation; a host crash between them requires reconciliation.

Local/CI validation without production access:

```bash
python3 -m unittest discover -s test/deploy -v
(cd savis-api && ./mvnw test)
./test/smoke/database.sh
```

The smoke test builds isolated containers, runs each migrator twice, tests failed
connections and normal API startup, checks version tables, and removes only its
disposable stack. CI also validates Compose and Supabase migrations locally.

Sources: [Supabase CLI v3 migration guide](https://supabase.com/docs/guides/local-development/cli/migrating-to-v3)
and [Supabase backups](https://supabase.com/docs/guides/platform/backups).
