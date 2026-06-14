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

if [[ "${EUID}" -eq 0 && -n "${SUDO_USER:-}" ]]; then
  echo "Run this installer as the graphical desktop user, without sudo." >&2
  echo "Current sudo user: ${SUDO_USER}" >&2
  exit 1
fi

export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/run/user/$(id -u)}"
export DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS:-unix:path=${XDG_RUNTIME_DIR}/bus}"

if [[ ! -S "${XDG_RUNTIME_DIR}/bus" ]]; then
  echo "The systemd user bus is not available at ${XDG_RUNTIME_DIR}/bus." >&2
  echo "Log in to the Ubuntu graphical desktop as $(id -un), then run this command" >&2
  echo "from that user's terminal without sudo." >&2
  exit 1
fi

if ! systemctl --user show-environment >/dev/null 2>&1; then
  echo "Unable to connect to the systemd user manager for $(id -un)." >&2
  echo "Ensure this is the same user that owns the active graphical session." >&2
  exit 1
fi

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
