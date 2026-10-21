#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
cli="${PLAYWRIGHT_CLI:-$HOME/.codex/skills/playwright/scripts/playwright_cli.sh}"
if [[ ! -x "$cli" ]]; then
  echo "Playwright CLI is unavailable: $cli" >&2
  exit 1
fi

port=5187
session="messages-pro-acceptance-$$"
server_log="$(mktemp)"
mkdir -p output/playwright
rm -f output/playwright/acceptance-report.json
./node_modules/.bin/vite preview --host 127.0.0.1 --port "$port" --strictPort >"$server_log" 2>&1 &
server_pid=$!
cleanup() {
  "$cli" -s="$session" close >/dev/null 2>&1 || true
  kill "$server_pid" >/dev/null 2>&1 || true
  rm -f "$server_log"
}
trap cleanup EXIT

ready=false
for _ in {1..40}; do
  if curl -fsS "http://127.0.0.1:$port/messages-pro/app/" >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 0.2
done
if [[ "$ready" != true ]]; then
  cat "$server_log" >&2
  exit 1
fi

# The root redirects to the report; only the report and two demos remain.
for path in "/messages-pro/" "/messages-pro/app/" "/messages-pro/infloww/" "/messages-pro/research/value-playbook/"; do
  curl -fsS "http://127.0.0.1:$port$path" >/dev/null
done
report_html="$(curl -fsS "http://127.0.0.1:$port/messages-pro/research/value-playbook/")"
for link in "/messages-pro/app/" "/messages-pro/infloww/"; do
  grep -q "href=\"$link\"" <<<"$report_html" || { echo "Report is missing a link to $link" >&2; exit 1; }
done
for path in "/messages-pro/reports/four-platform-module-comparison/index.html" "/messages-pro/research/" "/messages-pro/research/onlyfans/" "/messages-pro/research/infloww/" "/messages-pro/research/value-comparison/" "/messages-pro/research/feature-inventory/" "/messages-pro/design/crm/" "/messages-pro/design/crm-proposal/" "/messages-pro/validation/"; do
  status="$(curl -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port$path")"
  [[ "$status" == 404 ]] || { echo "Removed page still resolves: $path ($status)" >&2; exit 1; }
done

"$cli" -s="$session" open "http://127.0.0.1:$port/messages-pro/app/" >/dev/null
"$cli" -s="$session" run-code --filename tests/browser-acceptance.js |
  awk '/^### Result$/{getline; print; print > "output/playwright/acceptance-report.json"; next} /^### Error$/{print; getline; print}'
