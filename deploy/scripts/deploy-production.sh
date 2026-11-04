#!/usr/bin/env bash
set +x
set -Eeuo pipefail
umask 077

release_dir="$(cd "${1:?Usage: deploy-production.sh RELEASE_DIRECTORY}" && pwd)"
env_file="${SAVIS_ENV_FILE:-/etc/savis/savis.env}"
deploy_root="${SAVIS_DEPLOY_ROOT:-${HOME}/.local/share/savis/deploy}"
compose_file="${release_dir}/docker-compose.prod.yml"
release_manifest="${release_dir}/release.env"
safety="${release_dir}/deploy/scripts/deployment-safety.py"
backup_dir="${deploy_root}/backups"
phase=validation
log_file=""

compose() {
  docker compose --project-name savis --env-file "${env_file}" \
    --env-file "${release_manifest}" -f "${compose_file}" "$@"
}

# Child tools can print credentials on connection failure. Capture both streams
# in a private file, redact before display, and preserve the original exit code.
logged() {
  local status=0
  "$@" >"${log_file}" 2>&1 || status=$?
  python3 "${safety}" redact <"${log_file}"
  return "${status}"
}

finish() {
  local status=$?
  trap - EXIT
  if (( status != 0 )); then
    echo "Deployment failed during ${phase}; release markers are promoted only after validation. No database restore performed." >&2
    if [[ -n "${log_file}" ]]; then
      logged compose ps -a >&2 || true
      logged compose logs --tail=80 postgres rabbitmq backend_migrate executor_migrate backend_api executor_api executor_worker executor_beat frontend_admin >&2 || true
      local service container_id
      for service in postgres rabbitmq backend_api executor_api executor_worker frontend_admin; do
        container_id="$(compose ps -aq "${service}" 2>/dev/null || true)"
        if [[ -n "${container_id}" ]]; then
          echo "${service}: recent health results" >&2
          logged docker inspect --format '{{if .State.Health}}{{range .State.Health.Log}}{{println .End .ExitCode .Output}}{{end}}{{end}}' "${container_id}" >&2 || true
        fi
      done
    fi
  fi
  [[ -z "${log_file}" ]] || rm -f "${log_file}"
  exit "${status}"
}
trap finish EXIT

fail() { echo "$*" >&2; exit 1; }

wait_healthy() {
  local service="$1" deadline=$((SECONDS + health_timeout)) container_id state health
  while (( SECONDS < deadline )); do
    container_id="$(compose ps -aq "${service}" 2>/dev/null)" || fail "Cannot query container for ${service}"
    if [[ -z "${container_id}" ]]; then
      sleep "${poll_interval}"
      continue
    fi
    state="$(docker inspect --format '{{.State.Status}}' "${container_id}" 2>/dev/null)" || fail "Cannot inspect ${service} container"
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "${container_id}" 2>/dev/null)" || fail "Cannot inspect ${service} health"
    [[ "${state}" != exited && "${state}" != dead ]] || fail "${service} stopped before readiness"
    [[ "${health}" != missing ]] || fail "${service} has no Docker healthcheck"
    [[ "${state}" == running && "${health}" == healthy ]] && return 0
    # An unhealthy container may recover during startup; the deadline is final.
    sleep "${poll_interval}"
  done
  fail "${service} did not become healthy within ${health_timeout}s (container may be absent)"
}

for command in docker curl python3 systemctl df awk flock; do
  command -v "${command}" >/dev/null 2>&1 || fail "Missing required command: ${command}"
done
[[ -r "${env_file}" ]] || fail "Production environment is not readable"
[[ -r "${compose_file}" && -r "${release_manifest}" && -r "${safety}" ]] || fail "Release package is incomplete"
set -a
# shellcheck disable=SC1090
source "${env_file}"
# shellcheck disable=SC1090
source "${release_manifest}"
set +a
[[ "${SAVIS_VERSION:-}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "Invalid SAVIS_VERSION in release manifest"
[[ "${SUPABASE_ENABLED:-false}" == true || "${SUPABASE_ENABLED:-false}" == false ]] || fail "SUPABASE_ENABLED must be true or false"
health_timeout="${SAVIS_HEALTH_TIMEOUT_SECONDS:-600}"
poll_interval="${SAVIS_HEALTH_POLL_SECONDS:-5}"
for value in "${health_timeout}" "${poll_interval}"; do
  [[ "${value}" =~ ^[1-9][0-9]*$ ]] || fail "Health deadlines must be positive integer seconds"
done
mkdir -p "${deploy_root}" "${backup_dir}"
exec 9>"${deploy_root}/deployment.lock"
flock -n 9 || fail "Another deployment is in progress"
log_file="$(mktemp "${deploy_root}/.deploy-log.XXXXXX")"
logged docker compose version
logged compose config --quiet
for variable in SAVIS_API_IMAGE SAVIS_ADMIN_IMAGE SAVIS_EXECUTOR_IMAGE; do
  image="${!variable:-}"
  [[ "${image}" =~ ^ghcr\.io/wiljeanlouis/savis-[a-z]+@sha256:[a-f0-9]{64}$ ]] || fail "${variable} must contain an immutable GHCR digest reference"
  logged docker buildx imagetools inspect "${image}"
done
available_kb="$(df -Pk "${deploy_root}" | awk 'NR == 2 {print $4}')"
(( available_kb >= 5 * 1024 * 1024 )) || fail "At least 5 GiB of free disk space is required"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
for service in savis-chrome-cdp.service savis-chrome-cdp-proxy.service; do
  logged systemctl --user is-active --quiet "${service}"
done
logged curl --fail --silent --show-error --connect-timeout 5 --max-time 10 http://127.0.0.1:9223/json/version

previous_version=none
[[ ! -f "${deploy_root}/current-version" ]] || read -r previous_version <"${deploy_root}/current-version"
python3 "${safety}" report "${release_dir}"

phase=postgres-backup
postgres_id="$(compose ps -aq postgres 2>"${log_file}")" || {
  python3 "${safety}" redact <"${log_file}" >&2
  fail "Cannot query PostgreSQL container before backup"
}
if [[ -n "${postgres_id}" ]]; then
  wait_healthy postgres
  backup_file="${backup_dir}/savis-$(date -u +%Y%m%dT%H%M%SZ)-before-${SAVIS_VERSION}.dump"
  # Never log a binary dump or expose pg_dump stderr without redaction.
  if ! compose exec -T postgres pg_dump --username "${DB_USER}" --dbname "${DB_NAME}" --format=custom >"${backup_file}" 2>"${log_file}"; then
    python3 "${safety}" redact <"${log_file}" >&2
    fail "PostgreSQL backup failed; incomplete dump must not be used"
  fi
  [[ -s "${backup_file}" ]] || fail "PostgreSQL backup is empty"
else
  # An existing stopped database must never be mistaken for a first install.
  [[ "${previous_version}" == none ]] || fail "Previous release exists but PostgreSQL container is absent; recover it and back up before deployment"
  [[ "${SAVIS_INITIAL_INSTALL:-false}" == true ]] || fail "No PostgreSQL container: explicitly verify first installation with SAVIS_INITIAL_INSTALL=true; otherwise recover the database container and back up first"
  echo "First install explicitly confirmed: no PostgreSQL container to back up."
fi
phase=supabase-configuration
if [[ "${SUPABASE_ENABLED:-false}" == true ]]; then
  command -v npx >/dev/null 2>&1 || fail "npx is required for Supabase migrations"
  [[ -n "${SUPABASE_DB_URL:-}" ]] || fail "SUPABASE_DB_URL is required"
fi

phase=infrastructure
logged compose pull
logged compose up -d postgres rabbitmq
wait_healthy postgres
wait_healthy rabbitmq
phase=supabase-migrations
if [[ "${SUPABASE_ENABLED:-false}" == true ]]; then
  (
    cd "${release_dir}"
    # v3 explicitly targets the remote URL. Ordinary deployments reject backdated
    # migrations rather than silently using --include-all. Never apply seed/roles.
    logged npx --yes supabase@3.0.0 db push --remote="${SUPABASE_DB_URL}" --yes --skip-vault --dry-run
    logged npx --yes supabase@3.0.0 db push --remote="${SUPABASE_DB_URL}" --yes --skip-vault
  )
fi
phase=backend-migrations
logged compose run --rm --no-deps backend_migrate
phase=executor-migrations
logged compose run --rm --no-deps executor_migrate
phase=application-replacement
# All dependencies were explicitly migrated/checked. Do not let Compose recreate
# migration dependencies or infrastructure while replacing applications.
logged compose up -d --no-deps backend_api executor_api
wait_healthy backend_api
wait_healthy executor_api
logged compose up -d --no-deps executor_worker executor_beat frontend_admin
wait_healthy executor_worker
wait_healthy frontend_admin
# Beat has no readiness endpoint. Check its process separately without claiming
# that running alone proves scheduling is operational.
beat_id="$(compose ps -aq executor_beat 2>"${log_file}")" || {
  python3 "${safety}" redact <"${log_file}" >&2
  fail "Cannot query executor_beat container"
}
[[ -n "${beat_id}" ]] || fail "executor_beat container is absent"
beat_state="$(docker inspect --format '{{.State.Status}}' "${beat_id}" 2>/dev/null)" || fail "Cannot inspect executor_beat"
[[ "${beat_state}" == running ]] || fail "executor_beat is not running"

phase=promotion
# Perform final potentially failing diagnostics before promoting the release.
logged compose ps
ln -s "${release_dir}" "${deploy_root}/.current-next"
printf '%s\n' "${SAVIS_VERSION}" >"${deploy_root}/.current-version-next"
python3 -c 'import os, sys; os.replace(sys.argv[1], sys.argv[2])' "${deploy_root}/.current-next" "${deploy_root}/current"
mv -f "${deploy_root}/.current-version-next" "${deploy_root}/current-version"
echo "Deployment ${SAVIS_VERSION} validated."
