#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="${repo_dir}/compose/smoke.admin.yml"
project_name="${COMPOSE_PROJECT_NAME:-savis-admin-smoke}"
timeout_seconds="${SMOKE_TIMEOUT_SECONDS:-90}"

compose=(docker compose --project-name "${project_name}" -f "${compose_file}")

cleanup() {
  if [[ "${SMOKE_KEEP_CONTAINERS:-false}" != "true" ]]; then
    "${compose[@]}" down -v --remove-orphans >/dev/null || true
  fi
}

trap cleanup EXIT

cleanup

echo "Building SAVIS Admin production image..."
"${compose[@]}" build frontend_admin

echo "Starting SAVIS Admin container..."
"${compose[@]}" up -d backend_api executor_api frontend_admin

published_port="$("${compose[@]}" port frontend_admin 8080 | sed -E 's/.*:([0-9]+)$/\1/' | head -n 1)"
base_url="http://127.0.0.1:${published_port}"
deadline=$((SECONDS + timeout_seconds))

echo "Waiting for Nginx to serve ${base_url}/health..."
until curl -fsS "${base_url}/health" >/dev/null; do
  if (( SECONDS >= deadline )); then
    echo "Timed out waiting for SAVIS Admin health endpoint."
    "${compose[@]}" logs --no-color frontend_admin
    exit 1
  fi
  sleep 2
done

echo "Checking static entrypoint and SPA fallback..."
curl -fsS "${base_url}/" | grep -F "<!doctype html" >/dev/null
curl -fsS "${base_url}/catalog/products" | grep -F "<!doctype html" >/dev/null

logs="$("${compose[@]}" logs --no-color frontend_admin)"
printf '%s\n' "${logs}"

for pattern in \
  "emerg" \
  "host not found" \
  "permission denied" \
  "no such file or directory"
do
  if grep -Fiq "${pattern}" <<<"${logs}"; then
    echo "Admin smoke test failed: found '${pattern}' in container logs."
    exit 1
  fi
done

echo "Admin smoke test passed: Nginx started, health works, and SPA routes serve index.html."
