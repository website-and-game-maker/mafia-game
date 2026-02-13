#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[check] JS syntax"
node --check scripts/game.js
node --check scripts/render.js
node --check scripts/geography_data.js
node --check scripts/narration_data.js

echo "[check] localhost smoke"
python3 -m http.server 8000 >/tmp/mafia_quickcheck_http.log 2>&1 &
HTTP_PID=$!
cleanup() {
  kill "$HTTP_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT
sleep 1
curl -I --max-time 5 http://localhost:8000 >/tmp/mafia_quickcheck_curl.log

echo "[check] pass"
