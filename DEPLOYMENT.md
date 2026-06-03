# Deployment

The game has two pieces:

| Piece | What it is | Where it runs |
|-------|------------|---------------|
| **Static web client** | `index.html`, `host.html`, `join.html`, `solo.html`, `scripts/`, `styles/` | **GitHub Pages** (free, already public) |
| **Realtime relay** | `scripts/realtime_server.py` (WebSocket) | A small always-on host (Render free tier) — only needed for **multi-device online** play |

**Solo vs bots** and **single-device pass-and-play** are 100% static — they work on GitHub Pages with no backend. The relay is only for **multi-device** rooms where each person is on their own device.

---

## 1. GitHub Pages (static client)

Already configured to deploy from the `master` branch root. The live URL is:

```
https://pycoder42.github.io/mafia-game/
```

Any push to `master` redeploys. `.nojekyll` is present so every file (including `scripts/`) is served verbatim.

---

## 2. Realtime relay (online multiplayer)

This is the only step that needs a one-time account signup. ~3 minutes.

### Option A — Render (recommended, has a free tier)

1. Sign in / sign up at <https://dashboard.render.com>.
2. **New → Blueprint**, connect the `PyCoder42/mafia-game` repo. Render reads [`render.yaml`](render.yaml) and creates a free web service named `mafia-relay`.
   - (Or **New → Web Service** manually: Runtime **Python**, Build `pip install -r requirements.txt`, Start `python scripts/realtime_server.py`, Health check path `/health`.)
3. Wait for the first deploy to go live. Copy the service URL, e.g. `https://mafia-relay.onrender.com`.
4. Edit [`scripts/config.js`](scripts/config.js) and set the relay URL (note **`wss://`**, the secure WebSocket scheme):
   ```js
   productionRelayUrl: 'wss://mafia-relay.onrender.com'
   ```
5. Commit and push. GitHub Pages redeploys and **multi-device online multiplayer now works** — everyone opens the Pages URL, one person taps **Host Game**, the others tap **Join Game** and enter the room code.

> The free tier sleeps after ~15 minutes idle, so the very first connection can take ~30 seconds while it wakes up. The client shows "Waking up the online room service…" and pings it automatically; just wait and it connects.

### Option B — any WebSocket host

The relay reads the bind port from `$PORT` (falls back to 8765) and binds `0.0.0.0`. A `Procfile` (`web: python scripts/realtime_server.py`) is included for hosts that auto-detect it (e.g. Railway). After deploying, set `productionRelayUrl` to that host's `wss://…` URL in `scripts/config.js`.

If `productionRelayUrl` is left empty, the public site still runs solo + single-device fully; the multiplayer buttons just say online multiplayer isn't set up yet.

---

## 3. Local development / LAN play

Run everything locally with the unified backend (static server + relay together):

```bash
python3 server.py            # http://localhost:8000  + relay on :8765
```

On `localhost`/LAN the client auto-detects this backend (via `/api/network-info`), so you don't need to set `productionRelayUrl` for local testing. Open the printed LAN URL on other devices on the same network to play multi-device without any cloud host.
