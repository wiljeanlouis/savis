# Production migrations and recovery

No production command in this document is run by CI tests. A release deployment
is an operator action. Never modify applied migrations, run `clean`, `reset`,
`repair`, `downgrade`, or restore a database as part of ordinary deployment.

## Sequence and migration runners

`deploy-production.sh` validates the release, immutable digests, Compose,
dependencies, disk space (5 GiB), and Chrome. A host `flock` prevents concurrent
runs of this script. It requires an explicit migration review, backs up the
existing Docker PostgreSQL database, and checks the separate Supabase backup
attestation before pulling images. It starts PostgreSQL/RabbitMQ and waits for
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

## Explicit review before deployment

Automatic SQL classification cannot establish compatibility. Every production
release requires review, including Alembic Python and SQL embedded in immutable
images. Use the release source revision and image digests to identify their exact
contents. On a restored staging database, compare Flyway `info`, Alembic `current`
and `history`, and the Supabase CLI dry run with the production history. Verify
checksums, pending versions, dependencies, data backfills, constraints, lock time,
RLS/grants, and compatibility with **all currently running applications**,
including the old Worker, Beat, and public Supabase clients.

Supabase CLI is pinned to **3.0.0** in CI and production. Its installed
`db push --help` was checked: use `--remote=<URL> --yes`; `--db-url` belongs to
the prior targeting syntax. `npx --yes` accepts npm installation; the separate
CLI `--yes` authorizes noninteractive hosted changes. `--skip-vault` avoids
unrelated Vault changes. No seed or role deployment is enabled. Ordinary pushes
omit `--include-all`: out-of-order migrations/history discrepancies must be
investigated separately rather than forced through production.

Before approving, inspect the pending Supabase plan using the same pinned
`db push --remote=… --yes --skip-vault --dry-run` command in a trusted terminal.
Do not put credentials in shell history, enable tracing, or publish raw CLI
output. The script repeats this dry run immediately before applying and redacts
command output. The safety helper prints filenames containing potential SQL
risks (`DROP`, `TRUNCATE`, `DELETE`, `UPDATE`, `ALTER`, `REVOKE`, dynamic `EXECUTE`).
This intentionally conservative scan covers **all packaged Supabase migrations**,
including historical ones, and never prints SQL. It can overreport harmless
operations and miss indirect effects; absence of a match is not approval.
The pending dry run and human review remain mandatory.

Calculate the review token without connecting to any database:

```bash
release_dir=/absolute/path/to/savis-vX.Y.Z
deploy_root="$HOME/.local/share/savis/deploy"
previous_version=none
if [ -f "$deploy_root/current-version" ]; then
  read -r previous_version < "$deploy_root/current-version"
fi
fingerprint=$(python3 "$release_dir/deploy/scripts/deployment-safety.py" fingerprint "$release_dir")
# Replace vX.Y.Z with the exact SAVIS_VERSION from release.env.
review_token="vX.Y.Z:$previous_version:$fingerprint"
```

After explicit validation, export `SAVIS_MIGRATIONS_APPROVED_FOR="$review_token"`
in the deployment session. This attests that pending migrations, including any
destructive operations, have been reviewed and are safe while the previous
release remains live. The fingerprint binds the release manifest (including
all image digests) and all packaged Supabase SQL; changing either invalidates it.
Keep approval evidence in the change ticket. Do not copy an approval token from
another release or generate approval automatically in CI.

If old/new compatibility cannot be established, **do not approve this online
sequence**. Prepare a separately reviewed maintenance plan, quiesce writes and
consumers, verify backups, and specify which application versions remain safe.
The deployment script has no flag to silently waive compatibility.

## Separate Supabase backup verification

The Docker `pg_dump` covers only API/Executor PostgreSQL. It is never evidence
of a Supabase backup. The repository does not establish the hosted project's
plan, actual backup availability, PITR configuration, or successful restore test.
An operator must verify those in the correct Supabase project before deployment:

- identify a recent successful daily backup, PITR recovery point, or separately
  secured logical export, its retention, and acceptable data loss window;
- verify access to the restoration procedure and a restore test on an isolated
  target; record the project, backup time, restore test, RPO/RTO and owner;
- account separately for Storage objects and role credentials where applicable;
- record non-secret evidence in `SUPABASE_BACKUP_REFERENCE` and set
  `SUPABASE_BACKUP_VERIFIED_FOR="$review_token"` for this deployment.

This is a fail-closed **operator attestation**, not an API verification of backup
existence. No Supabase access token or permanent infrastructure is introduced.
Never include a connection string or password in the evidence reference.
Supabase restore requires an explicit incident decision: it can discard customer
submissions and other writes made after the recovery point. No automatic restore
or SQL undo is implemented.

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
separate, approved data recovery operation that may lose intervening writes.

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
