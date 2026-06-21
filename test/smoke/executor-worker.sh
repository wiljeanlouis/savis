#!/usr/bin/env bash
set -Eeuo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
compose_file="${repo_dir}/test/smoke/compose/executor.yml"
project_name="${COMPOSE_PROJECT_NAME:-savis-smoke}"
timeout_seconds="${SMOKE_TIMEOUT_SECONDS:-${SMOKE_WAIT_SECONDS:-90}}"

compose=(docker compose --project-name "${project_name}" -f "${compose_file}")

cleanup() {
  if [[ "${SMOKE_KEEP_CONTAINERS:-false}" != "true" ]]; then
    "${compose[@]}" down -v --remove-orphans >/dev/null || true
  fi
}

trap cleanup EXIT

echo "Starting RabbitMQ and executor worker smoke stack..."
"${compose[@]}" up -d --build rabbitmq executor_worker

echo "Waiting up to ${timeout_seconds}s for the worker to become ready..."
deadline=$((SECONDS + timeout_seconds))
ready=false

while (( SECONDS < deadline )); do
  logs="$("${compose[@]}" logs --no-color executor_worker 2>/dev/null || true)"
  if grep -Fq "ready." <<<"${logs}"; then
    ready=true
    break
  fi
  sleep 2
done

sleep 3

"${compose[@]}" ps

worker_container="$("${compose[@]}" ps --status running -q executor_worker)"
if [[ -z "${worker_container}" ]]; then
  echo "executor_worker is not running."
  "${compose[@]}" logs --no-color rabbitmq executor_worker
  exit 1
fi

logs="$("${compose[@]}" logs --no-color rabbitmq executor_worker)"
printf '%s\n' "${logs}"

if [[ "${ready}" != "true" ]] && ! grep -Fq "ready." <<<"${logs}"; then
  echo "Smoke test failed: executor_worker did not report Celery readiness."
  exit 1
fi

for pattern in \
  "INTERNAL_ERROR" \
  "transient_nonexcl_queues" \
  "global_qos" \
  "Connection to broker lost" \
  "RestartFreqExceeded" \
  "Traceback (most recent call last)"
do
  if grep -Fq "${pattern}" <<<"${logs}"; then
    echo "Smoke test failed: found '${pattern}' in container logs."
    exit 1
  fi
done

echo "Smoke test passed: executor_worker stayed healthy and blocked startup failure patterns were absent."
