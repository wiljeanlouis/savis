#!/usr/bin/env bash

set -Eeuo pipefail

release_dir="${1:?Usage: deploy-production.sh RELEASE_DIRECTORY}"
env_file="${SAVIS_ENV_FILE:-/etc/savis/savis.env}"
deploy_root="${SAVIS_DEPLOY_ROOT:-${HOME}/.local/share/savis/deploy}"
compose_file="${release_dir}/compose.prod.yml"
release_manifest="${release_dir}/release.env"
backup_dir="${deploy_root}/backups"

compose() {
  docker compose \
    --project-name savis \
    --env-file "${env_file}" \
    --env-file "${release_manifest}" \
    -f "${compose_file}" \
    "$@"
}

show_diagnostics() {
  echo "Deployment failed. Current service state:" >&2
  compose ps >&2 || true
  compose logs --tail=150 backend_api executor_migrate executor_api executor_worker frontend_admin >&2 || true
}

trap show_diagnostics ERR

for command in docker curl sha256sum; do
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

if [[ ! "${SAVIS_VERSION:-}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Invalid SAVIS_VERSION in release manifest" >&2
  exit 1
fi

for variable in SAVIS_API_IMAGE SAVIS_ADMIN_IMAGE SAVIS_EXECUTOR_IMAGE; do
  image="${!variable:-}"
  if [[ ! "${image}" =~ ^ghcr\.io/wiljeanlouis/savis-[a-z]+@sha256:[a-f0-9]{64}$ ]]; then
    echo "${variable} must contain an immutable GHCR digest reference" >&2
    exit 1
  fi
  docker buildx imagetools inspect "${image}" >/dev/null
done

available_kb="$(df -Pk "${deploy_root}" | awk 'NR == 2 {print $4}')"
if (( available_kb < 5 * 1024 * 1024 )); then
  echo "At least 5 GiB of free disk space is required" >&2
  exit 1
fi

export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
systemctl --user is-active --quiet savis-chrome-cdp.service
systemctl --user is-active --quiet savis-chrome-cdp-proxy.service
curl --fail --silent --show-error http://127.0.0.1:9223/json/version >/dev/null

mkdir -p "${backup_dir}"
if compose ps --status running -q postgres | grep -q .; then
  backup_file="${backup_dir}/savis-$(date -u +%Y%m%dT%H%M%SZ)-before-${SAVIS_VERSION}.dump"
  compose exec -T postgres pg_dump \
    --username "${DB_USER}" \
    --dbname "${DB_NAME}" \
    --format=custom >"${backup_file}"
  chmod 0600 "${backup_file}"
fi

compose pull
compose up -d postgres rabbitmq

if [[ "${SUPABASE_ENABLED:-false}" == "true" ]]; then
  if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
    echo "SUPABASE_DB_URL is required when SUPABASE_ENABLED=true" >&2
    exit 1
  fi
  command -v npx >/dev/null 2>&1 || {
    echo "npx is required to deploy Supabase migrations" >&2
    exit 1
  }
  (
    cd "${release_dir}"
    npx --yes supabase db push --db-url "${SUPABASE_DB_URL}" --include-all
  )
fi

compose run --rm executor_migrate
compose up -d backend_api executor_api

for service in backend_api executor_api; do
  for _ in {1..60}; do
    container_id="$(compose ps -q "${service}")"
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
    [[ "${health}" == "healthy" ]] && break
    [[ "${health}" == "unhealthy" || "${health}" == "exited" ]] && exit 1
    sleep 5
  done
  [[ "${health}" == "healthy" ]] || {
    echo "${service} did not become healthy" >&2
    exit 1
  }
done

compose up -d executor_worker executor_beat frontend_admin --remove-orphans

for _ in {1..60}; do
  container_id="$(compose ps -q frontend_admin)"
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
  [[ "${health}" == "healthy" ]] && break
  [[ "${health}" == "unhealthy" || "${health}" == "exited" ]] && exit 1
  sleep 5
done
[[ "${health}" == "healthy" ]] || {
  echo "frontend_admin did not become healthy" >&2
  exit 1
}

ln -sfn "${release_dir}" "${deploy_root}/current"
printf '%s\n' "${SAVIS_VERSION}" >"${deploy_root}/current-version"
compose ps
