#!/usr/bin/env python3
"""
Deploy the Mafia realtime relay to Val Town as an HTTP val.

Usage:
  VALTOWN_TOKEN=<your token> python3 valtown/deploy.py

Get a token at https://www.val.town/settings/api with the `val:write` scope
(read is fine too). The script:
  1. Reuses an existing val named MAFIA_RELAY (or creates it).
  2. Writes valtown/mafia-relay.ts into its main.tsx as an HTTP val.
  3. Prints the public https:// endpoint and the wss:// URL to put in
     scripts/config.js (productionRelayUrl).

Only depends on the Python standard library.
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.val.town"
VAL_NAME = os.environ.get("MAFIA_RELAY_VAL_NAME", "mafia-relay")
RELAY_FILE = Path(__file__).resolve().parent / "mafia-relay.ts"


def req(method: str, path: str, token: str, body: dict | None = None) -> dict:
    url = f"{API}{path}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    request = urllib.request.Request(url, data=data, method=method)
    request.add_header("Authorization", f"Bearer {token}")
    request.add_header("Content-Type", "application/json")
    request.add_header("Accept", "application/json")
    try:
        with urllib.request.urlopen(request) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        raise SystemExit(f"[deploy] {method} {path} -> HTTP {e.code}: {detail}")
    except urllib.error.URLError as e:
        raise SystemExit(f"[deploy] {method} {path} -> network error: {e}")


def find_existing_val(token: str) -> dict | None:
    me = req("GET", "/v2/me", token)
    username = me.get("username") or me.get("handle")
    # Page through the current user's vals looking for our name.
    offset = 0
    while True:
        page = req("GET", f"/v2/me/vals?limit=100&offset={offset}", token)
        items = page.get("data") or page.get("items") or []
        for v in items:
            if str(v.get("name", "")).lower() == VAL_NAME.lower():
                return v
        if len(items) < 100:
            break
        offset += 100
    _ = username
    return None


def main() -> None:
    token = os.environ.get("VALTOWN_TOKEN") or os.environ.get("VAL_TOWN_API_KEY")
    if not token:
        raise SystemExit(
            "[deploy] Set VALTOWN_TOKEN (val:write scope). "
            "Create one at https://www.val.town/settings/api"
        )
    if not RELAY_FILE.exists():
        raise SystemExit(f"[deploy] Missing relay source: {RELAY_FILE}")
    code = RELAY_FILE.read_text(encoding="utf-8")

    override_id = os.environ.get("MAFIA_RELAY_VAL_ID", "").strip()
    if override_id:
        val_id = override_id
        print(f"[deploy] Using val id from MAFIA_RELAY_VAL_ID ({val_id})")
    else:
        try:
            existing = find_existing_val(token)
        except SystemExit as e:
            # A lookup hiccup must not block a first-time deploy — just create fresh.
            print(f"[deploy] (lookup skipped: {e})")
            existing = None
        if existing:
            val_id = existing.get("id")
            print(f"[deploy] Reusing existing val '{VAL_NAME}' ({val_id})")
        else:
            print(f"[deploy] Creating val '{VAL_NAME}'...")
            val = req("POST", "/v2/vals", token, {"name": VAL_NAME, "privacy": "public"})
            val_id = val.get("id")
            if not val_id:
                raise SystemExit(f"[deploy] Unexpected create response (no id): {val}")

    # Upload main.tsx. The Val Town files API takes `path` as a query-string
    # parameter; content + type go in the body. PUT updates an existing file,
    # POST creates a new one.
    qs = "path=" + urllib.parse.quote("main.tsx")
    try:
        file_resp = req("PUT", f"/v2/vals/{val_id}/files?{qs}", token, {"content": code, "type": "http"})
    except SystemExit:
        file_resp = req("POST", f"/v2/vals/{val_id}/files?{qs}", token, {"content": code, "type": "http"})

    links = (file_resp or {}).get("links") or {}
    endpoint = links.get("endpoint", "")
    if not endpoint:
        # Fall back to fetching the val to read its endpoint link.
        val = req("GET", f"/v2/vals/{val_id}", token)
        endpoint = ((val.get("links") or {}).get("endpoint")) or ""

    print("\n[deploy] DONE")
    print(f"  val id    : {val_id}")
    print(f"  https url : {endpoint}")
    if endpoint.startswith("https://"):
        wss = "wss://" + endpoint[len("https://"):]
        print(f"  wss  url  : {wss}")
        print("\n  -> Put this in scripts/config.js:")
        print(f"       productionRelayUrl: '{wss}'")
    else:
        print("  (could not determine endpoint URL; check the val in the Val Town UI)")


if __name__ == "__main__":
    main()
