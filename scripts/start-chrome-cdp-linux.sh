#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This script is intended for Linux." >&2
  exit 1
fi

chrome_cdp_port="${CHROME_CDP_PORT:-9222}"
chrome_profile_dir="${CHROME_CDP_PROFILE_DIR:-${HOME}/.savis/maxi-cdp-profile}"
chrome_cdp_url="http://127.0.0.1:${chrome_cdp_port}"

if [[ -n "${CHROME_APP_PATH:-}" ]]; then
  chrome_app_path="${CHROME_APP_PATH}"
elif command -v google-chrome-stable >/dev/null 2>&1; then
  chrome_app_path="$(command -v google-chrome-stable)"
elif command -v google-chrome >/dev/null 2>&1; then
  chrome_app_path="$(command -v google-chrome)"
else
  echo "Google Chrome application not found. Set CHROME_APP_PATH." >&2
  exit 1
fi

if curl --silent --fail "${chrome_cdp_url}/json/version" >/dev/null; then
  echo "Chrome CDP is already available at ${chrome_cdp_url}."
  exit 0
fi

mkdir -p "${chrome_profile_dir}"

echo "Starting Google Chrome with the SAVIS profile..."
nohup "${chrome_app_path}" --ozone-platform=x11 \
  "--remote-debugging-address=0.0.0.0" \
  "--remote-debugging-port=${chrome_cdp_port}" \
  "--remote-allow-origins=*" \
  "--user-data-dir=${chrome_profile_dir}" \
  "https://www.maxi.ca/" \
  >"${chrome_profile_dir}/chrome.log" 2>&1 </dev/null &

for _ in {1..30}; do
  if curl --silent --fail "${chrome_cdp_url}/json/version" >/dev/null; then
    echo "Chrome CDP is available at ${chrome_cdp_url}."
    exit 0
  fi
  sleep 1
done

echo "Chrome started, but ${chrome_cdp_url}/json/version is not reachable. See ${chrome_profile_dir}/chrome.log." >&2
exit 1
