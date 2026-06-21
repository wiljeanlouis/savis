#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This script is intended for Ubuntu Linux." >&2
  exit 1
fi

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this installer with sudo." >&2
  exit 1
fi

for command in install runuser systemctl; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "Missing command: ${command}" >&2
    exit 1
  fi
done

service_user="${SAVIS_SERVICE_USER:-savis}"
env_file="${SAVIS_ENV_FILE:-/etc/savis/savis.env}"
deploy_root="${SAVIS_DEPLOY_ROOT:-/home/${service_user}/.local/share/savis/deploy}"

if ! id "${service_user}" >/dev/null 2>&1; then
  echo "Missing service user: ${service_user}" >&2
  exit 1
fi

if [[ ! -r "${env_file}" ]]; then
  echo "Production environment is not readable: ${env_file}" >&2
  exit 1
fi

if [[ ! -x "${deploy_root}/current/deploy/scripts/backup-postgres-production.sh" ]]; then
  echo "Backup script is not executable: ${deploy_root}/current/deploy/scripts/backup-postgres-production.sh" >&2
  exit 1
fi

if ! runuser -u "${service_user}" -- rclone version >/dev/null 2>&1; then
  echo "rclone is not available for user ${service_user}." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "${script_dir}/../.." && pwd)"
unit_source_dir="${repo_dir}/deploy/systemd"
unit_target_dir="/etc/systemd/system"

install -m 0644 \
  "${unit_source_dir}/savis-postgres-backup.service" \
  "${unit_source_dir}/savis-postgres-backup.timer" \
  "${unit_target_dir}/"

systemctl daemon-reload
systemctl enable --now savis-postgres-backup.timer

echo "PostgreSQL backup timer is installed and enabled."
echo "Check it with: systemctl status savis-postgres-backup.timer"
echo "Run a backup with: sudo systemctl start savis-postgres-backup.service"
echo "Read logs with: journalctl -u savis-postgres-backup.service -n 100 --no-pager"
