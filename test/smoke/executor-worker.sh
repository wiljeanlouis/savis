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
  worker_container="$("${compose[@]}" ps -q executor_worker)"
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "${worker_container}" 2>/dev/null || true)"
  if [[ "${health}" == healthy ]]; then
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

if [[ "${ready}" != "true" ]]; then
  echo "Smoke test failed: executor_worker did not become Docker healthy."
  docker inspect --format '{{json .State.Health}}' "${worker_container}"
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

probe_until() {
  local expected="$1" probe_status
  deadline=$((SECONDS + timeout_seconds))
  while (( SECONDS < deadline )); do
    probe_status=0
    "${compose[@]}" exec -T executor_worker python -m app.adapters.celery.worker_health >/dev/null 2>&1 || probe_status=$?
    if [[ "${expected}" == healthy && "${probe_status}" == 0 ]] ||
       [[ "${expected}" == unhealthy && "${probe_status}" != 0 ]]; then
      return 0
    fi
    sleep 2
  done
  echo "Smoke test failed: worker probe did not become ${expected}."
  "${compose[@]}" logs --no-color --tail=80 executor_worker
  return 1
}

echo "Checking probe failure and recovery across a broker outage..."
"${compose[@]}" exec -T rabbitmq rabbitmqctl stop_app
probe_until unhealthy
"${compose[@]}" exec -T rabbitmq rabbitmqctl start_app
probe_until healthy

echo "Checking readiness while a long task occupies the prefork child..."
"${compose[@]}" exec -T executor_worker python -c \
  "from app.adapters.celery.celery_app import celery_app; celery_app.send_task('smoke.long_running_health_check')"
deadline=$((SECONDS + timeout_seconds))
while ! "${compose[@]}" exec -T executor_worker test -f /tmp/smoke-task-started; do
  if (( SECONDS >= deadline )); then
    echo "Smoke test failed: long task did not start."
    exit 1
  fi
  sleep 2
done
for iteration in 1 2 3; do
  "${compose[@]}" exec -T executor_worker python -c \
    "import time; from app.adapters.celery.worker_health import HEARTBEAT_PATH, heartbeat_is_fresh; before = HEARTBEAT_PATH.stat().st_mtime; time.sleep(12); assert heartbeat_is_fresh(); assert HEARTBEAT_PATH.stat().st_mtime > before"
  if [[ "${iteration}" == 1 ]]; then
    "${compose[@]}" exec -T executor_worker test ! -f /tmp/smoke-task-finished
  fi
done
"${compose[@]}" exec -T executor_worker test -f /tmp/smoke-task-finished

logs="$("${compose[@]}" logs --no-color rabbitmq executor_worker)"
for pattern in "INTERNAL_ERROR" "transient_nonexcl_queues" "global_qos"; do
  if grep -Fq "${pattern}" <<<"${logs}"; then
    echo "Smoke test failed after recovery: found '${pattern}' in container logs."
    exit 1
  fi
done

echo "Smoke test passed: Docker readiness, broker recovery, and long task isolation verified."
