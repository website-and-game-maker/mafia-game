#!/usr/bin/env bash
# Deploy the Mafia realtime relay to Deno Deploy (native WebSockets).
#
# Usage:
#   DENO_DEPLOY_TOKEN=<your token> bash deno-deploy/deploy.sh
#
# Get a token at https://dash.deno.com/account#access-tokens (sign in with
# GitHub). After it deploys, the production URL is https://<project>.deno.dev;
# put wss://<project>.deno.dev into scripts/config.js (productionRelayUrl).
set -euo pipefail

PROJECT="${DENO_PROJECT:-mafia-relay-pycoder42}"
DENO_BIN="${DENO_BIN:-$HOME/.deno/bin/deno}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -z "${DENO_DEPLOY_TOKEN:-}" ]; then
  echo "[deploy] Set DENO_DEPLOY_TOKEN (from https://dash.deno.com/account#access-tokens)" >&2
  exit 1
fi

echo "[deploy] Deploying project '$PROJECT' to Deno Deploy..."
# Only upload the relay entry + its single dependency (not the whole repo).
"$DENO_BIN" run -A jsr:@deno/deployctl deploy \
  --prod \
  --project="$PROJECT" \
  --entrypoint=deno-deploy/relay.ts \
  --include=deno-deploy/relay.ts \
  --include=valtown/mafia-relay.ts

echo ""
echo "[deploy] Done. Production URLs:"
echo "  https : https://$PROJECT.deno.dev"
echo "  wss   : wss://$PROJECT.deno.dev"
echo ""
echo "  -> Put this in scripts/config.js:"
echo "       productionRelayUrl: 'wss://$PROJECT.deno.dev'"
