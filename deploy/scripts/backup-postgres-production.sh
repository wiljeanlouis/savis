#!/usr/bin/env bash

set -Eeuo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
script_release_dir="$(cd "${script_dir}/../.." && pwd)"
release_dir="${1:-${SAVIS_RELEASE_DIR:-${script_release_dir}}}"
env_file="${SAVIS_ENV_FILE:-/etc/savis/savis.env}"
deploy_root="${SAVIS_DEPLOY_ROOT:-$(cd "${release_dir}/.." && pwd)}"
compose_file="${release_dir}/docker-compose.prod.yml"
release_manifest="${release_dir}/release.env"
backup_dir="${SAVIS_POSTGRES_BACKUP_DIR:-${deploy_root}/backups/postgres}"
local_retention_days="${SAVIS_POSTGRES_BACKUP_LOCAL_RETENTION_DAYS:-7}"
remote_retention_days="${SAVIS_POSTGRES_BACKUP_REMOTE_RETENTION_DAYS:-90}"
min_free_kb="${SAVIS_POSTGRES_BACKUP_MIN_FREE_KB:-1048576}"
lock_file="${SAVIS_POSTGRES_BACKUP_LOCK_FILE:-${deploy_root}/backup-postgres.lock}"

compose() {
  docker compose \
    --project-name savis \
    --env-file "${env_file}" \
    --env-file "${release_manifest}" \
    -f "${compose_file}" \
    "$@"
}

for command in docker flock rclone; do
  command -v "${command}" >/dev/null 2>&1 || {
    echo "Missing required command: ${command}" >&2
    exit 1
  }
done

docker compose version >/dev/null

if [[ ! -r "${env_file}" ]]; then
  echo "Production environment is not readable: ${env_file}" >&2
  exit 1
fi

if [[ ! -r "${compose_file}" || ! -r "${release_manifest}" ]]; then
  echo "Release package is incomplete: ${release_dir}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${env_file}"
# shellcheck disable=SC1090
source "${release_manifest}"
set +a

for variable in DB_USER DB_NAME RCLONE_BACKUP_REMOTE; do
  if [[ -z "${!variable:-}" ]]; then
    echo "Missing required variable: ${variable}" >&2
    exit 1
  fi
done

mkdir -p "${backup_dir}" "$(dirname "${lock_file}")"

exec 9>"${lock_file}"
if ! flock -n 9; then
  echo "Another PostgreSQL backup is already running." >&2
  exit 1
fi

available_kb="$(df -Pk "${backup_dir}" | awk 'NR == 2 {print $4}')"
if (( available_kb < min_free_kb )); then
  echo "At least ${min_free_kb} KiB of free disk space is required in ${backup_dir}" >&2
  exit 1
fi

postgres_container_id="$(compose ps --status running -q postgres)"
if [[ -z "${postgres_container_id}" ]]; then
  echo "Production PostgreSQL container is not running." >&2
  exit 1
fi

health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "${postgres_container_id}")"
if [[ "${health}" != "healthy" ]]; then
  echo "Production PostgreSQL is not healthy: ${health}" >&2
  exit 1
fi

remote="${RCLONE_BACKUP_REMOTE%/}"
timestamp="$(date -u +'%Y-%m-%d_%H-%M-%S')"
file_name="savis_${DB_NAME}_${timestamp}.dump"
local_file="${backup_dir}/${file_name}"
tmp_file="${local_file}.tmp"

cleanup_tmp() {
  rm -f "${tmp_file}"
}
trap cleanup_tmp EXIT

echo "[1/5] Creating PostgreSQL backup ${file_name}..."
compose exec -T postgres pg_dump \
  --username "${DB_USER}" \
  --dbname "${DB_NAME}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --verbose \
  >"${tmp_file}"

test -s "${tmp_file}"
chmod 0600 "${tmp_file}"
mv "${tmp_file}" "${local_file}"

echo "[2/5] Uploading backup to ${remote}..."
rclone copyto "${local_file}" "${remote}/${file_name}"

echo "[3/5] Verifying remote backup..."
rclone lsf "${remote}" --files-only | grep -Fx "${file_name}" >/dev/null

echo "[4/5] Cleaning local backups older than ${local_retention_days} days..."
find "${backup_dir}" -type f -name '*.dump' -mtime "+${local_retention_days}" -delete

echo "[5/5] Cleaning remote backups older than ${remote_retention_days} days..."
rclone delete "${remote}" --include '*.dump' --min-age "${remote_retention_days}d"
rclone rmdirs "${remote}" --leave-root

echo "PostgreSQL backup completed successfully: ${file_name}"
