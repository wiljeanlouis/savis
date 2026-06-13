#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This script is intended for Ubuntu Linux." >&2
  exit 1
fi

for command in google-chrome socat systemctl; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "Missing command: ${command}" >&2
    echo "Install Google Chrome stable and socat before running this script." >&2
    exit 1
  fi
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "${script_dir}/.." && pwd)"
unit_source_dir="${repo_dir}/savis-executor/deploy/systemd"
unit_target_dir="${HOME}/.config/systemd/user"

mkdir -p "${unit_target_dir}" "${HOME}/.local/share/savis/maxi-cdp-profile"
install -m 0644 \
  "${unit_source_dir}/savis-chrome-cdp.service" \
  "${unit_source_dir}/savis-chrome-cdp-proxy.service" \
  "${unit_target_dir}/"

systemctl --user daemon-reload
systemctl --user enable --now \
  savis-chrome-cdp.service \
  savis-chrome-cdp-proxy.service

echo "Chrome CDP services are installed and running."
echo "Set BROWSER_CDP_URL=http://host.docker.internal:9223 in the production .env file."
echo "Check them with: systemctl --user status savis-chrome-cdp.service savis-chrome-cdp-proxy.service"
