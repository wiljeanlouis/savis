#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="${repo_dir}/test/smoke/compose/database.yml"
project_name="${COMPOSE_PROJECT_NAME:-savis-database-smoke}"
timeout_seconds="${SMOKE_TIMEOUT_SECONDS:-180}"

compose=(docker compose --project-name "${project_name}" -f "${compose_file}")

cleanup() {
  if [[ "${SMOKE_KEEP_CONTAINERS:-false}" != "true" ]]; then
    "${compose[@]}" down -v --remove-orphans >/dev/null || true
  fi
}

trap cleanup EXIT

wait_for_healthy() {
  local service="$1"
  local deadline=$((SECONDS + timeout_seconds))
  local container_id
  local health

  while (( SECONDS < deadline )); do
    container_id="$("${compose[@]}" ps -q "${service}" 2>/dev/null || true)"
    if [[ -n "${container_id}" ]]; then
      health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
      if [[ "${health}" == "healthy" ]]; then
        return 0
      fi
      if [[ "$(docker inspect -f '{{.State.Status}}' "${container_id}")" == "exited" ]]; then
        echo "${service} exited before becoming healthy."
        "${compose[@]}" logs --no-color "${service}"
        return 1
      fi
    fi
    sleep 2
  done

  echo "Timed out waiting for ${service} to become healthy."
  "${compose[@]}" logs --no-color "${service}"
  return 1
}

psql() {
  "${compose[@]}" exec -T postgres psql -v ON_ERROR_STOP=1 -U savis -d savis "$@"
}

echo "Starting PostgreSQL database smoke stack..."
"${compose[@]}" up -d --build postgres rabbitmq
"${compose[@]}" build backend_migrate backend_api executor_migrate
wait_for_healthy postgres
wait_for_healthy rabbitmq

# Blocking one-shot runs propagate nonzero exit codes and must be repeatable.
"${compose[@]}" run --rm --no-deps backend_migrate
api_history="$(psql -Atc "select count(*) from savis_api.flyway_schema_history")"
"${compose[@]}" run --rm --no-deps executor_migrate
"${compose[@]}" run --rm --no-deps backend_migrate
"${compose[@]}" run --rm --no-deps executor_migrate
[[ "$(psql -Atc "select count(*) from savis_api.flyway_schema_history")" == "${api_history}" ]]
[[ "$(psql -Atc "select count(*) from savis_executor.alembic_version")" == 1 ]]

# A failed connection must produce a failing process for each migrator.
if "${compose[@]}" run --rm --no-deps -e SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:1/savis backend_migrate; then
  echo "Flyway unexpectedly succeeded against an unavailable database"; exit 1
fi
if "${compose[@]}" run --rm --no-deps -e DATABASE_URL=postgresql+psycopg://savis:savis@127.0.0.1:1/savis executor_migrate; then
  echo "Alembic unexpectedly succeeded against an unavailable database"; exit 1
fi
"${compose[@]}" up -d --no-deps backend_api

echo "Waiting for Spring Boot readiness after separate migrations/JPA validation..."
wait_for_healthy backend_api

if "${compose[@]}" logs --no-color backend_api | grep -Fq 'org.flywaydb'; then
  echo "Flyway must not execute during normal API startup"; exit 1
fi

echo "Checking migrated schemas..."
psql -c "select schema_name from information_schema.schemata where schema_name in ('savis_api', 'savis_executor') order by schema_name;"
psql -c "select count(*) as flyway_rows from savis_api.flyway_schema_history;"
psql -c "select count(*) as alembic_rows from savis_executor.alembic_version;"

logs="$("${compose[@]}" logs --no-color postgres executor_migrate backend_api)"
printf '%s\n' "${logs}"

for pattern in \
  "ERROR:" \
  "FlywayException" \
  "BeanCreationException" \
  "Schema-validation" \
  "Traceback (most recent call last)" \
  "Migration failed"
do
  if grep -Fq "${pattern}" <<<"${logs}"; then
    echo "Database smoke test failed: found '${pattern}' in container logs."
    exit 1
  fi
done

echo "Database smoke test passed: Postgres started, Flyway ran, Alembic ran, and migrated schemas are queryable."
