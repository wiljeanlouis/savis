#!/usr/bin/env bash

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${SAVIS_LOCAL_BACKUP_DIR:-${repo_root}/.local/backups/postgres}"

env_file="${repo_root}/.env.local"
compose_env_file="${repo_root}/.env.supabase.local"

if [[ ! -f "${env_file}" ]]; then
  echo "Missing local environment file: .env.local" >&2
  exit 1
fi

if [[ ! -f "${compose_env_file}" ]]; then
  compose_env_file="${env_file}"
fi

set -a
# shellcheck disable=SC1090
source "${env_file}"
# shellcheck disable=SC1090
source "${compose_env_file}"
set +a

for command in docker rclone; do
  command -v "${command}" >/dev/null 2>&1 || {
    echo "Missing required command: ${command}" >&2
    exit 1
  }
done

for variable in DB_USER DB_PASSWORD DB_NAME RCLONE_BACKUP_REMOTE; do
  if [[ -z "${!variable:-}" ]]; then
    echo "Missing required variable: ${variable}" >&2
    exit 1
  fi
done

compose=(
  docker compose
  -f "${repo_root}/docker-compose.yml"
  --env-file "${compose_env_file}"
)

echo "[1/6] Finding latest production backup in ${RCLONE_BACKUP_REMOTE}..."

latest_backup="$(
  rclone lsf "${RCLONE_BACKUP_REMOTE}" --files-only \
    | grep -E '\.dump$' \
    | sort \
    | tail -n 1 \
    || true
)"

if [[ -z "${latest_backup}" ]]; then
  echo "No .dump backup found in ${RCLONE_BACKUP_REMOTE}" >&2
  exit 1
fi

mkdir -p "${backup_dir}"
local_file="${backup_dir}/${latest_backup}"

echo "[2/6] Downloading ${latest_backup}..."
rclone copyto "${RCLONE_BACKUP_REMOTE}/${latest_backup}" "${local_file}"
test -s "${local_file}"

echo "[3/6] Stopping local app services and starting PostgreSQL..."
"${compose[@]}" stop backend_api executor_api executor_worker executor_beat frontend_admin executor_migrate >/dev/null 2>&1 || true
"${compose[@]}" up -d postgres

for _ in {1..60}; do
  container_id="$("${compose[@]}" ps -q postgres)"
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "${container_id}")"
  [[ "${health}" == "healthy" ]] && break
  [[ "${health}" == "unhealthy" ]] && {
    echo "Local PostgreSQL is unhealthy" >&2
    exit 1
  }
  sleep 2
done

if [[ "${health}" != "healthy" ]]; then
  echo "Local PostgreSQL did not become healthy" >&2
  exit 1
fi

echo "[4/6] Recreating local database ${DB_NAME}..."
"${compose[@]}" exec -T postgres psql \
  --username "${DB_USER}" \
  --dbname postgres \
  --set ON_ERROR_STOP=1 \
  --set dbname="${DB_NAME}" \
  --set dbuser="${DB_USER}" <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = :'dbname'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS :"dbname";
CREATE DATABASE :"dbname" OWNER :"dbuser";
SQL

echo "[5/6] Restoring ${latest_backup}..."
"${compose[@]}" exec -T postgres pg_restore \
  --username "${DB_USER}" \
  --dbname "${DB_NAME}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  <"${local_file}"

echo "[6/6] Running local database migrations..."
"${compose[@]}" build executor_migrate
"${compose[@]}" run --rm executor_migrate

echo "Local database restored from production backup: ${latest_backup}"
echo "Run make run-local to restart the full local stack."
