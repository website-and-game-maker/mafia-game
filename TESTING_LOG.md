# Testing Log

This file tracks testing sessions. AI and humans add test results here.

---

## Session 1: Code Analysis (2026-02-09)

**Method:** Static code analysis (no browser)

| Test | Status |
|------|--------|
| Game Balance Validation | PASS |
| Full Game Flow | PASS |
| Game Ending Explanation | PASS |
| Multiplayer Mode | PASS |
| Back Button Navigation | PASS |

**Note:** Code looks correct. Manual browser testing still recommended.

---

## Session 2: Playwright Browser Regression (2026-02-13)

**Tester:** Codex
**Method:** Playwright MCP (`http://localhost:8000`) + targeted runtime simulations via `page.evaluate`

### Results
| Test | Status | Notes |
|------|--------|-------|
| Main menu load + navigation | PASS | Setup screen rendered correctly; solo/multiplayer routing works. |
| Multiplayer name entry via Enter | PASS | Enter adds player and keeps input focused for rapid entry. |
| Pass-and-play privacy prompts | PASS | Reveal/day/night/discussion/vote use `Pass to <name>` wording. |
| Mafia-only day planning UI | PASS | Mafia actions are clearly labeled and separated from town actions. |
| Snoop target action flow | PASS | `Snoop a specific room` requires target selection before plan confirm. |
| Night mafia target cards | PASS | Cards show location, planned action, tracked target, and snooper intel when visible. |
| Intel fallback messaging | PASS | Players with no strong result still receive non-empty fallback intel text. |
| Discussion before voting | PASS | Non-solo flow always enters discussion before vote; per-player pass prompt works. |
| Discussion chat attribution | PASS | Messages include sender names and multi-player sender selection is available. |
| Vote flow + game over messaging | PASS | Voting, elimination, winner banner, final death/win reason, and new game flow validated. |
| Lobby role-balance safety (mafia parity) | PASS | Warning appears and start is blocked when Mafia >= Town. |
| Classic preset ratio function | PASS | `calculateRolesFromPreset('classic', 12)` returns 5 Mafia / 3 Doctor / 2 Detective / 2 Villager; small-count outputs remain valid. |
| Detective constraints | PASS | Detective action set excludes lock-style action in private room and shows detective posture note. |
| Bot pacing/auto-advance | PASS | Bot-facing transition cards show `Auto-continuing...` and auto-progress without extra clicks. |
| Runtime console health | PASS | No Playwright console/page errors observed during session. |

### Bugs Found
- Doctor morning privacy prompt was occasionally skipped after mafia night console (state carried `showRole = true`) → fixed in `processNight()` by resetting `state.showRole = false` before `morning_doctor`.

### Notes
- Added targeted simulation checks for probabilistic behavior:
  - Mafia nearby visibility mode returns only local targets when valid.
  - Detective snoopers are detected significantly less often than villager snoopers (empirical run: ~0.37 vs ~0.73).
  - Doctor save chance curve decreases as attack count increases (configured probabilities: 0.78 → 0.50 → 0.22).

---

## Session 3: Narration + Atmosphere Feature Regression (2026-02-13)

**Tester:** Codex
**Method:** Playwright MCP (`http://localhost:8000`) with targeted `page.evaluate` scenario setup

### Results
| Test | Status | Notes |
|------|--------|-------|
| Bot discussion lines (enabled) | PASS | `queueBotDiscussion(true)` generated bot-authored chat lines in discussion. |
| Bot discussion lines (disabled) | PASS | With `settings.botChat = false`, no bot chat messages were generated. |
| Discussion chat rendering for bot lines | PASS | Bot messages displayed in chat with sender attribution and bot-specific styling class. |
| Discussion chat prominence trigger | PASS | Chat panel receives prominent styling class when multiple human senders are present. |
| Sender attribution selection | PASS | Selecting a sender posts message under that selected player identity (`senderName`/`senderId` match). |
| Death animation card (enabled) | PASS | Announcement modal showed animated death card with victim and revealed role. |
| Death animation card (disabled) | PASS | No death animation state/card persisted when `settings.deathAnimations = false`. |
| Human narrator console feed | PASS | Narrator console displayed recent non-spoiler narration entries with phase/day context. |
| Sound effects toggle runtime gating | PASS | `SoundEffects.playDeath()` skipped init path when sounds disabled, ran init path when enabled (`whenOff=0`, `whenOn=1`). |
| Runtime console health | PASS | No Playwright console errors in this session. |

### Bugs Found
- None in this slice.

### Notes
- Playwright MCP had intermittent Chrome profile lock startup failures (`Opening in existing browser session`); session continued with local app quit/relaunch workaround and tests completed.

---

## Session 4: Realtime Multi-Device Regression (2026-02-13)

**Tester:** Codex
**Method:** Playwright MCP multi-tab run + local realtime relay (`python3 scripts/realtime_server.py --port 8765`)

### Results
| Test | Status | Notes |
|------|--------|-------|
| Host realtime connect in multiplayer lobby | PASS | Realtime mode connected successfully (`ws://localhost:8765`) with host role shown. |
| Join link onboarding (`?join=CODE`) | PASS | Join-code card appears on setup and opens directly into realtime client lobby. |
| Device presence list | PASS | Both host/client lobbies show connected devices when count > 1. |
| Hide device list when only one device | PASS | With a single connected device, connected-device panel is not rendered. |
| Cross-device lobby action forwarding | PASS | Client-side Add Player action (`Zoe`) forwarded to host; host and client stayed in sync. |
| Cross-device phase/state sync | PASS | Host `Start Game` moved both tabs into role reveal/day flow in sync. |
| Client-to-host gameplay action forwarding | PASS | Client `Got it!` reveal action advanced host and client to day phase. |
| Runtime console health | PASS | No console errors after recursion fix. |

### Bugs Found
- Realtime mode initially caused recursion (`Maximum call stack size exceeded`) from global name collision between internal `connectRealtime`/`disconnectRealtime` functions and window handlers.
  - Fix: renamed internal functions to `connectRealtimeSession` / `disconnectRealtimeSession` and updated all call sites.

### Notes
- Realtime relay requires `websockets` Python package (`pip install websockets` or `pip install -r requirements.txt`).

---

## Session 5: Project Hygiene Verification (2026-02-13)

**Tester:** Codex
**Method:** Static checks + local script execution

### Results
| Test | Status | Notes |
|------|--------|-------|
| Responsibility split audit (`game.js` vs `render.js`) | PASS | `rg \"<[a-zA-Z]\" scripts/game.js scripts/render.js` returned UI markup only in `scripts/render.js` (none in `scripts/game.js`). |
| Backup snapshot script execution | PASS | Ran `scripts/create_backup.sh`; generated `/Users/saahir/Desktop/Coding/mafia-game-backup-20260212-193953.tar.gz`. |

### Bugs Found
- None.

### Notes
- Backup archive intentionally created outside repo root (parent directory) per hygiene requirement.

---

## Session 6: Localhost Access + Lobby/Flow Validation Attempt (2026-02-13)

**Tester:** Codex
**Method:** Playwright MCP + local tunnel fallback investigation

### Results
| Test | Status | Notes |
|------|--------|-------|
| Local server health (`python3 -m http.server 8000`) | PASS | `curl -I http://localhost:8000` returned `HTTP/1.0 200 OK`. |
| Playwright MCP direct localhost navigation | FAIL | MCP browser returned `net::ERR_CONNECTION_REFUSED` for `http://localhost:8000` despite healthy local server. |
| Playwright MCP local file fallback | FAIL | MCP browser blocks `file://` protocol (`Allowed protocols: http:, https:, about:, data:`). |
| Playwright MCP tunnel navigation (`localtunnel`) | PARTIAL | Tunnel URL opened, but reminder/password gate and intermittent context close states prevented stable end-to-end regression run. |

### Bugs Found
- No new gameplay regressions were confirmed in this session because full browser pass was blocked by environment/tooling connectivity.

### Notes
- Added localhost/tunnel operational guidance and known Playwright MCP constraints to `AGENTS.md`.
- This session should be followed by a fresh Playwright run once MCP can access localhost or a stable tunnel session is available.

---

## Test Checklist

Use this for browser testing sessions.

### Main Menu
- [ ] Page loads without errors
- [ ] How to Play modal opens
- [ ] How to Play tabs work (Basics, This Version, Multiplayer)
- [ ] Settings modal opens
- [ ] Settings toggles work

### Solo Mode
- [ ] Name entry works
- [ ] Add bot button works
- [ ] Remove bot button works
- [ ] Role presets change configuration
- [ ] Manual +/- role buttons work
- [ ] Mafia >= Town shows warning
- [ ] Start blocked when Mafia >= Town
- [ ] Back button returns to menu
- [ ] Start Game works with valid config

### Multiplayer Mode
- [ ] Add human players works
- [ ] Remove players works
- [ ] Add/remove bots works
- [ ] Copy link button works
- [ ] Back button returns to menu

### Game Phases
- [ ] Role Reveal shows role correctly
- [ ] Day phase - location selection
- [ ] Day phase - action selection
- [ ] Night phase - Mafia target selection
- [ ] Morning - Doctor save option
- [ ] Announcement shows death info
- [ ] Discussion shows intel
- [ ] Vote phase works
- [ ] Vote announcement shows result
- [ ] Day number increments

### Game End
- [ ] Game Over shows winner
- [ ] Shows final death info
- [ ] Shows win reason
- [ ] New Game button works

---

## Session Template

Copy this for new sessions:

```
## Session [N]: [Description] ([Date])

**Tester:** [Name]
**Method:** [Browser/Code Analysis]

### Results
| Test | Status | Notes |
|------|--------|-------|
| ... | PASS/FAIL | ... |

### Bugs Found
- [Description] → Added to TODOS.md

### Notes
[Any observations]
```

## Session 7: Coding-First Sanity Checks (2026-02-13)

**Tester:** Codex
**Method:** Repeatable sanity script (`scripts/run_quick_checks.sh`) + direct `node --check`, no full browser regression yet

### Results
| Test | Status | Notes |
|------|--------|-------|
| `node --check scripts/game.js` | PASS | Syntax valid after geography/exposure/night overhaul. |
| `node --check scripts/render.js` | PASS | Syntax valid after UI flow updates (exposure, night method/medicine, device ordering controls). |
| `node --check scripts/geography_data.js` | PASS | Map graph data file syntax valid. |
| `node --check scripts/narration_data.js` | PASS | Narration preset data file syntax valid. |
| Localhost smoke (`curl -I http://localhost:8000`) | PASS | `scripts/run_quick_checks.sh` started temporary server and returned HTTP 200 headers. |
| Architecture split audit (`rg \"<[a-zA-Z]\" scripts/game.js scripts/render.js`) | PASS | UI/template markup remains in `scripts/render.js`; `scripts/game.js` stayed logic-only. |

### Bugs Found
- None from static checks.

### Notes
- Full Playwright/browser validation intentionally deferred in this session to follow coding-first instruction before exhaustive testing.

## Session 8: Full Button Sweep + Multi-Device Control Pass (2026-02-13)

**Tester:** Codex
**Method:** Local Playwright (global module) against localhost server
- Open method: `python3 -m http.server 8000` then run `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
- Multi-device control pass method: same localhost + `python3 scripts/realtime_server.py --port 8765` and targeted Playwright script

### Results
| Test | Status | Notes |
|------|--------|-------|
| Setup screen buttons (`How to Play`, tab switching, close) | PASS | Modal tabs and close flow worked without console/page errors. |
| Multiplayer single-device lobby controls | PASS | Add/remove/reorder player controls, Enter-key name input behavior, mode switches all worked. |
| Single-device pass-and-play + full game cycle | PASS | Automated sweep completed reveal -> day -> night -> morning doctor -> discussion -> vote -> gameover. |
| Exposure UI + door-option removal | PASS | Exposure badges rendered and legacy door-option block absent. |
| Mafia night strike controls | PASS | Target selection + kill-method selection + confirm strike path rendered and worked. |
| Doctor night medicine controls | PASS | Medicine loadout options rendered and confirm flow worked. |
| Multi-device room controls (`Connect`, `Host This Room`, `Join This Room`, `Copy`, `Disconnect`) | PASS | Verified with realtime relay server running on `ws://localhost:8765`. |
| Geography and action model assertions | PASS | Story location count > 4, no `coordinate strike`, and location-first action model checks passed in targeted run. |

### Bugs Found
- `copyLink()` threw page error in restricted clipboard context (`Clipboard: Write permission denied`).
  - Fix: wrapped clipboard write in try/catch and added fallback copy method.
- Switching to `Multi-device` mode auto-attempted websocket connect and produced immediate console errors when relay was down.
  - Fix: removed auto-connect on mode switch for normal host flow; connect now happens explicitly via `Connect` (join-code auto-connect path preserved).
- Multiplayer name input focus could drop right after Enter in rapid-entry flow.
  - Fix: strengthened focus restoration with `requestAnimationFrame` + short timeout after add.

### Notes
- Added repeatable button sweep script: `scripts/playwright_button_sweep.js`.
- Playwright dependency was provided via global installation for this environment; browser automation succeeded locally even though MCP Playwright localhost access remains blocked.

## Session 9: Lobby UX + Realtime Stability Regression (2026-02-13)

**Tester:** Codex  
**Method:** Localhost + scripted Playwright checks
- `bash scripts/run_quick_checks.sh`
- `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
- Targeted Playwright scripts for new lobby behaviors (large room code modal, setup help icon removal, device-name focus persistence)
- Realtime two-page host/join validation with local relay (`python3 scripts/realtime_server.py --host 127.0.0.1 --port 8765`)

### Results
| Test | Status | Notes |
|------|--------|-------|
| Static/smoke checks (`run_quick_checks.sh`) | PASS | JS syntax checks + localhost smoke returned pass. |
| Full button sweep regression | PASS | Completed sweep with no fatal errors (`[sweep] PASS`). |
| Setup screen help icon cleanup | PASS | Setup header no longer shows redundant `?` icon; `How to Play` remains primary entry point. |
| Host large room-code display | PASS | `Show Large` opens modal with oversized room code and close flow works. |
| Device-name input focus persistence | PASS | Forcing `render()` while editing keeps focus and value on `#realtimeDeviceNameInput`. |
| Realtime host/join connection status | PASS | Host and join both reached `Connection: Connected` using room code + `join.html?join=<CODE>`. |
| Realtime offline guidance copy | PASS | Lobby shows actionable status detail text while disconnected/connecting. |

### Bugs Found
- None in this regression pass.

### Notes
- Multi-device reliability improvements in this slice were validated against an active relay and include clearer non-technical status messaging when connection fails.

## Session 10: Major Overhauls + 10-Run Full Matrix (2026-02-13)

**Tester:** Codex  
**Method:** Localhost + relay + automated Playwright regression matrix
- HTTP server: `python3 -m http.server 8000`
- Realtime relay: `python3 scripts/realtime_server.py --host 127.0.0.1 --port 8765`
- Quick checks: `bash scripts/run_quick_checks.sh`
- 10-run matrix: `NODE_PATH=$(npm root -g) node scripts/playwright_ten_run_matrix.js`
- Button sweep: `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`

### Results
| Test | Status | Notes |
|------|--------|-------|
| Major-overhaul floorplan map smoke | PASS | In-game map modal opens with floor tabs and floor images for stories using floorplan metadata. |
| Entry-page split smoke (`index` portal -> `host`/`join`/`game`) | PASS | Portal links resolve to separate flow pages with correct entry behavior. |
| `run_quick_checks.sh` | PASS | Syntax + localhost smoke checks passed. |
| 10-run scenario matrix (solo/passplay/realtime) | PASS | Final matrix run reached `10/10 passed` with gameover reached in all runs. |
| Updated button sweep regression | PASS | Script completed with `[sweep] PASS` after selector/flow updates for new UI. |

### Bugs Found
- Test harness compatibility regressions after page/flow split:
  - `scripts/playwright_ten_run_matrix.js` used stale setup selectors and missed `Reveal My Role` handling in non-solo reveal flow.
  - `scripts/playwright_button_sweep.js` expected removed setup controls and removed medicine flow.
  - Fix: updated both scripts for portal/entry pages, current lobby controls, and current gameplay progression buttons.

### Notes
- Matrix coverage included 4 solo runs, 3 single-device pass-and-play runs, and 3 realtime multi-device host/join runs with relay connectivity.
- This session was used as the evidence pass to clear completed items from `TODOS.md` (including raw uncategorized entries).

## Session 11: Final Priority + Overhaul Verification (2026-02-14)

**Tester:** Codex  
**Method:** Local Playwright only (no non-Playwright tests counted for completion)
- HTTP server: `python3 -m http.server 8000`
- Realtime relay: `python3 scripts/realtime_server.py --host 127.0.0.1 --port 8765`
- Sweep: `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
- 10-run matrix (final code state): `NODE_PATH=$(npm root -g) node scripts/playwright_ten_run_matrix.js`
- Targeted Playwright checks (inline script) for requested UI/flow details

### Results
| Test | Status | Notes |
|------|--------|-------|
| Full button sweep regression | PASS | `[sweep] PASS` on updated code after selector hardening. |
| 10-run matrix (solo/passplay/realtime) | PASS | Final run reached `10/10 passed` on latest code state. |
| Back navigation from multiplayer | PASS | `← Back` returns to setup correctly on `index.html` multiplayer flow. |
| `?` icon border artifact | PASS | No visible border/focus ring (`borderWidth=0`, `outline=none`, `boxShadow=none`). |
| Join portal copy behavior | PASS | Copy button by portal URL shows positive feedback and copies successfully. |
| Important lobby text contrast | PASS | Connection/status lines render as white/high-contrast text. |
| Legacy classic 12-player helper line removal | PASS | Helper text no longer appears in role config UI. |
| Instructions modal title/subheader wording | PASS | Modal title is `Instructions` with explicit variant warning subheader. |
| Join flow prominence | PASS | Join panel has large join-code input (`.join-code-input` font-size >= 20px). |
| Host page join controls hidden | PASS | `host.html` has no join controls and shows `Host device` banner. |
| QR copy shortcut behavior | PASS | Clicking QR block triggers room-code copy feedback. |
| Large room code modal portal URL | PASS | Modal includes join portal URL and copy action. |
| Regenerate code option removal | PASS | No regenerate-code control rendered. |
| Host remove-device control | PASS | Host removal action disconnects target and shows removal status on joiner. |
| Room code collision guard | PASS | Two different host contexts seeded with same code resolved to distinct active codes. |

### Bugs Found
- Playwright harness flake in matrix/sweep from detached elements during rerender (not gameplay logic):
  - `scripts/playwright_ten_run_matrix.js` and `scripts/playwright_button_sweep.js` occasionally stalled on `.click()` with 30s timeout.
  - Fix: hardened helper click paths (`clickIfVisible`, `clickLocatorIfVisible`, `chooseFirstIfNoneSelected`) with short-timeout click + dispatch fallback.
- Realtime kicked-device status was being overwritten by websocket `onclose` cleanup:
  - Fix: preserve kicked state/detail in `connectRealtimeSession()` close handler when close code/reason indicates host kick.

### Notes
- This session was the final verification pass for the latest prioritized requests and both major overhauls.
- `TODOS.md` was cleaned to active-only with completed/tested items removed and uncategorized raw notes cleared.

## Session 12: Host/Join/Solo Page Split + Python Backend Verification (2026-02-14)

**Tester:** Codex  
**Method:** Playwright + new Python backend (`python3 server.py`)

### Results
| Test | Status | Notes |
|------|--------|-------|
| Backend startup (`python3 server.py`) | PASS | HTTP server is live at `http://127.0.0.1:8000`, and relay starts at `ws://127.0.0.1:8765` via project venv interpreter. |
| Main regression sweep (`scripts/playwright_button_sweep.js`) | PASS | Completed setup -> multiplayer checks -> solo run -> gameover (`[sweep] PASS`). |
| Full 10-run matrix (`scripts/playwright_ten_run_matrix.js`) | PASS | Final run summary `10/10 passed` across solo/passplay/realtime scenarios. |
| Index multiplayer choice page | PASS | After clicking Multiplayer on `index.html`, screen shows only prominent `Host Game` and `Join Game` choices (no lobby inputs). |
| Host page join-option removal | PASS | `host.html` does not render join-game controls. |
| Fast-link label text removal | PASS | `Direct hotlink (joins this room)` no longer appears in host share UI. |
| Join page independence | PASS | `join.html` runs as a full app page and remains on `join.html` during joined flow. |
| Solo page availability | PASS | `solo.html` runs as a full dedicated solo page for the solo flow. |

### Bugs Found
- Sweep/matrix script assumptions broke after new page split (`index -> multiplayer choice`, `solo.html` navigation):
  - Fix: updated Playwright scripts to follow new routing and wait for URL transitions.
- New backend relay startup initially failed under system Python due missing `websockets`:
  - Fix: `server.py` now auto-selects project venv Python for relay startup (`venv/bin/python3.12` fallback chain) and still keeps HTTP available.
- Realtime relay runtime error during disconnect cleanup (`RuntimeError: Set changed size during iteration` in broadcast loop):
  - Fix: iterate over a snapshot list of clients in `broadcast()` to avoid set mutation during cleanup.

### Notes
- This session validates the latest owner-requested architecture split (`index.html`, `host.html`, `join.html`, `solo.html`) and one-command Python backend startup.

## Session 13: Join Lobby Guardrails + Clean Join Portal URL (2026-02-14)

**Tester:** Codex  
**Method:** Playwright-first verification on local backend
- Backend: `python3 server.py` (HTTP + relay)
- Targeted guardrails: `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_join_guardrails.js`
- Regression sweep: `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
- 10-run matrix: `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_ten_run_matrix`

### Results
| Test | Status | Notes |
|------|--------|-------|
| Join guardrail suite | PASS | Verified join input focus stability, invalid-code rejection, no false connected state, code lock after join, join-only controls (no host/single-device toggles), drag only in `📱 Your Device`, no drag handles in `🧩 Devices and Players`, read-only setup cards, and portal URL not containing `join.html`. |
| Button sweep regression | PASS | `[sweep] PASS` after route/selector compatibility updates and restoring `solo.html` entry file. |
| 10-run matrix (solo + host-local + realtime) | PASS | Final summary `10/10 passed` with gameover reached across all runs. |

### Bugs Found
- `join.html` blank-screen regression:
  - Root cause: `renderJoinEntry()` and `join_entry` branch were missing from `scripts/render.js`.
  - Fix: restored `renderJoinEntry()` and re-added `state.screen === 'join_entry'` render branch.
- Join-client page identity overwritten after host sync:
  - Root cause: realtime snapshot apply path overwrote `entryPage` and `realtimePanelMode` from host snapshot.
  - Fix: preserve `entryPage` and `realtimePanelMode` in `applyRealtimeStateSnapshot()`.
- Invalid-room join acceptance on relay:
  - Root cause: relay allowed joiners to implicitly create rooms.
  - Fix: `scripts/realtime_server.py` now rejects non-host joins when room code does not exist.

### Notes
- Host share portal URL now uses clean portal base URL under HTTP(S) and no longer displays `join.html` in the shown/copied portal link.
- `TODOS.md` was cleared for this slice after implementation + Playwright verification.

## Session 14: Settings-Math Overhaul + Absolute URL Share Validation (2026-02-14)

**Tester:** Codex  
**Method:** Playwright-first verification on local backend (`python3 server.py`)

### Results
| Test | Status | Notes |
|------|--------|-------|
| Active TODO targeted suite (`scripts/playwright_active_todos.js`) | PASS | Verified: host join portal is absolute HTTP(S), fast join link is absolute HTTP(S), neither URL contains `join.html`, localhost run prefers LAN portal URL from `/api/network-info`, advanced link options appear with alternates, preset descriptions are literal role-target text, settings profiles change disturbance/cure/exposure math, and join read-only lobby shows selected environment profile details. |
| Join guardrails (`scripts/playwright_join_guardrails.js`) | PASS | Verified join input stability, invalid-code rejection, join-only controls, read-only setup restrictions, and no `join.html` in portal URL. |
| Button sweep (`scripts/playwright_button_sweep.js`) | PASS | `[sweep] PASS` through setup, multiplayer navigation checks, solo run, and gameover. |
| 10-run matrix (`scripts/playwright_ten_run_matrix`) | PASS | Final summary `10/10 passed` across solo, pass-and-play, and realtime host/join scenarios. |

### Bugs Found
- Realtime relay startup compatibility break with newer `websockets` package:
  - Symptom: backend reported missing dependency even when package existed.
  - Root cause: import of `websockets.server.WebSocketServerProtocol` is version-sensitive.
  - Fix: `scripts/realtime_server.py` now uses version-tolerant protocol typing (`WebSocketServerProtocol = Any`) while still requiring `websockets` runtime.
- New targeted Playwright script compatibility issue:
  - Symptom: `allInputValues` API unavailable in installed Playwright build.
  - Fix: switched to explicit locator iteration with `.count()` + `.inputValue()` loop.

### Notes
- `/api/network-info` currently returns LAN-preferred URL on localhost runs (for example `http://192.168.1.208:8000/`) with localhost/current-device URLs in alternates.

## Session 15: LAN-Preferred Backend + Static-Host Diagnosis + QR UX (2026-02-19)

**Tester:** Codex  
**Method:** Playwright + backend/static-host split validation

### Results
| Test | Status | Notes |
|------|--------|-------|
| Backend networking suite (`scripts/playwright_network_overhaul_checks.js`) | PASS | Verified LAN/origin/custom networking settings section, backend detection note, LAN-preferred portal behavior, host/disconnect promoted buttons (`btn-lg`), QR rendered as click-only tile (no `<img>`, no separate QR copy button), tooltip text `Click to copy`, and solo narrator `Human` option hidden. |
| Static-host diagnosis suite (`EXPECT_STATIC=1 scripts/playwright_network_overhaul_checks.js`) | PASS | On static host (`python3 -m http.server 5500`), host attempt now reports explicit relay/backend guidance instead of ambiguous offline text. |
| Join guardrails (`scripts/playwright_join_guardrails.js`) | PASS | Join focus stability, invalid-code rejection, join-only controls, read-only setup, and join URL behavior all pass. |
| Button sweep (`scripts/playwright_button_sweep.js`) | PASS | Sweep passes end-to-end through setup/multiplayer navigation/solo gameplay to gameover. |
| Device naming sequence (`scripts/playwright_device_name_sequence.js`) | PASS | Three-device realtime join validated default labels `Device 1`, `Device 2`, `Device 3`. |
| 10-run matrix (`scripts/playwright_ten_run_matrix`) | PASS | Final summary `10/10 passed` across solo, passplay, and realtime runs after networking/QR changes. |

### Root Cause Diagnosis
- Reported issue (`Connection: Offline ... Could not start room connection from this URL`) is triggered when app is served by static hosts (for example VS Code Live Server) that do not provide the websocket relay endpoint used for multi-device rooms.
- Fix/mitigation implemented:
  - explicit static-host diagnosis in status messaging
  - in-app networking mode controls (LAN / Same URL / Custom + advanced details)
  - backend-safe LAN preference with automatic fallback to current origin when LAN is unavailable
  - LAN mode disabled when LAN URL is unavailable

## Session 16: Local Backend Auto-Recovery + Static-Host Autoswitch (2026-02-20)

**Tester:** Codex  
**Method:** Playwright + backend/static-host split checks

### Results
| Test | Status | Notes |
|------|--------|-------|
| Static host without backend (`EXPECT_STATIC=1`) | PASS | `scripts/playwright_network_overhaul_checks.js` now validates backend-missing messaging without false connected state. |
| Static host with backend autoswitch (`EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1`) | PASS | Opening `http://127.0.0.1:5500/host.html` auto-switches to `http://127.0.0.1:8000/host.html` when backend is reachable. |
| Backend networking suite | PASS | `scripts/playwright_network_overhaul_checks.js` passes with backend CORS-enabled `/api/network-info`, settings networking controls, QR behaviors, and host connect flow. |
| Join guardrails regression | PASS | `scripts/playwright_join_guardrails.js` passes after backend/autoswitch changes. |
| Button sweep regression | PASS | `scripts/playwright_button_sweep.js` passes through setup, multiplayer nav, solo game, and gameover. |

### Root Cause + Fix
- Root cause: when launched from static hosts (for example VS Code Live Server), the app could not use same-origin `/api/network-info`, so it stayed in backend-missing mode even if local backend existed.
- Fixes implemented:
  - `server.py` now returns CORS headers for API endpoints and exposes `/api/ensure-backend` + `/api/health`.
  - `scripts/game.js` now probes local backend candidates (`:8000`) from local/static contexts and auto-switches to backend origin when detected.
  - Multiplayer status text now reflects automatic backend recovery flow instead of hardcoded `python3` command prompts.

### Commands Run
- `EXPECT_STATIC=1 MAFIA_BASE_URL=http://127.0.0.1:5500 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1 MAFIA_BASE_URL=http://127.0.0.1:5500 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_join_guardrails.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`

## Session 18: Join Retry Stability + Read-Only Joiner UI Regression (2026-02-24)

**Tester:** Codex  
**Method:** Playwright guardrail suite + static/backend split checks

### Results
| Test | Status | Notes |
|------|--------|-------|
| Backend networking suite | PASS | `scripts/playwright_network_overhaul_checks.js` passed on `http://127.0.0.1:8000`, including absolute portal URL checks and QR click-copy behavior checks. |
| Join guardrails | PASS | `scripts/playwright_join_guardrails.js` passed after updating connect-attempt lifecycle and join-lobby assertions for hidden multiplayer card on connected non-host clients. |
| Button sweep regression | PASS | `scripts/playwright_button_sweep.js` passed through setup, multiplayer navigation, solo game flow, and gameover. |
| Static host diagnosis (no backend) | PASS | `EXPECT_STATIC=1` run on `http://127.0.0.1:8002` showed expected static-host behavior. |
| Static host autoswitch (backend available) | PASS | `EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1` run on `http://127.0.0.1:8002` correctly switched to backend host URL. |

### Root Cause + Fix
- Root cause: retrying join after an invalid code could race with an in-flight connect attempt, leaving stale join state and making guardrails flaky.
- Fixes:
  - `scripts/game.js`: added cancellable realtime connect-attempt tracking (`connectAttemptId`, pending socket/timer cleanup) and stricter stale-attempt guards in websocket callbacks.
  - `scripts/game.js`: join/host reconnect paths now clear active `connecting` attempts before starting a fresh one.
  - `scripts/game.js`: host connected copy updated to remove legacy “direct hotlink” wording.
  - `scripts/playwright_join_guardrails.js`: updated to assert join success via read-only lobby state instead of deprecated `Connection:` row visibility after join.

### Commands Run
- `node --check scripts/game.js`
- `node --check scripts/render.js`
- `node --check scripts/playwright_join_guardrails.js`
- `node --check scripts/playwright_network_overhaul_checks.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_join_guardrails.js`
- `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
- `EXPECT_STATIC=1 MAFIA_BASE_URL=http://127.0.0.1:8002 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1 MAFIA_BASE_URL=http://127.0.0.1:8002 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`

## Session 19: Host Failure Recovery Path (2026-03-09)

**Tester:** Codex  
**Method:** Playwright regression + direct starter execution

### Results
| Test | Status | Notes |
|------|--------|-------|
| Static host without backend (`EXPECT_STATIC=1`) | PASS | Host failure now shows a room-service starter recovery card with starter download links. |
| Starter launcher script (`./start_room_service.command`) | PASS | Launcher starts `server.py`, opens the host page, and brings up the local backend/relay. |
| Backend networking suite | PASS | `scripts/playwright_network_overhaul_checks.js` passed after launcher/error-state changes. |
| Join guardrails regression | PASS | `scripts/playwright_join_guardrails.js` remained green after host recovery changes. |
| Button sweep regression | PASS | `scripts/playwright_button_sweep.js` passed end-to-end. |
| Static host autoswitch with backend available | PASS | `EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1` still redirects to backend host URL successfully. |
| Visual inspection of static error state | PASS | Verified the new `Room Service Starter` card is rendered after host failure and shows Mac/Windows starter links. |

### Root Cause + Fix
- Root cause: a plain browser page cannot directly spawn `server.py`, so `Host Game` fails whenever no local backend process is already running.
- Fixes implemented:
  - Added a host error-state recovery card in `scripts/render.js` with starter downloads surfaced only when hosting fails due missing room service.
  - Added starter resolution helpers in `scripts/game.js` and tightened host error copy to point at the new recovery path.
  - Added `start_room_service.command` and `start_room_service.bat` so hosting can be started with a single local launcher action instead of typing `python3 server.py`.
  - Added `--open-page` to `server.py` so the launcher can open `host.html` automatically once the backend is up.
  - Extended `scripts/playwright_network_overhaul_checks.js` to require the new starter affordance in the static failure path.

### Commands Run
- `node --check scripts/game.js`
- `node --check scripts/render.js`
- `python3 -m py_compile server.py`
- `EXPECT_STATIC=1 MAFIA_BASE_URL=http://127.0.0.1:8002 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `./start_room_service.command`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_join_guardrails.js`
- `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
- `EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1 MAFIA_BASE_URL=http://127.0.0.1:8002 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`

## Session 17: Host-Click Backend Recovery + Localhost Link Suppression (2026-02-20)

**Tester:** Codex  
**Method:** Playwright + focused static/backend networking runs

### Results
| Test | Status | Notes |
|------|--------|-------|
| Static host without backend (`EXPECT_STATIC=1`) | PASS | Host view no longer exposes localhost/127 join URL as a usable share link; host-click failure text is user-facing and non-technical. |
| Static host with backend autoswitch (`EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1`) | PASS | `host.html` on static origin switches to backend host URL and host connect succeeds. |
| Backend networking suite | PASS | Join portal remains absolute and multiplayer-safe (no localhost/127 portal URL in backend host flow). |
| Join guardrails regression | PASS | `scripts/playwright_join_guardrails.js` remains green after host-click backend-ensure changes. |
| Button sweep regression | PASS | `scripts/playwright_button_sweep.js` passes end-to-end after lobby/networking copy and URL logic updates. |

### Root Cause + Fix
- Root cause: share-link selection could still fall back to local-only origins (`127.*`/`localhost`) before backend networking was fully ready.
- Fixes implemented:
  - `scripts/game.js` now filters join portal URLs to shareable network hosts only.
  - Host click path now runs explicit backend ensure/recovery attempt before opening websocket room flow.
  - User-facing multiplayer copy was simplified (non-technical default text; no command-style setup prompts in normal flow).

### Commands Run
- `EXPECT_STATIC=1 MAFIA_BASE_URL=http://127.0.0.1:5500 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1 MAFIA_BASE_URL=http://127.0.0.1:5500 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_network_overhaul_checks.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_join_guardrails.js`
- `MAFIA_BASE_URL=http://127.0.0.1:8000 NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`

---

## Session 20: Bug Review + GitHub Pages / Online-Relay Deploy Prep (2026-06-03)

**Tester:** Claude Code (Opus 4.8)
**Method:** Playwright (headless Chromium) — full-flow sweeps, deterministic logic-fix verification, and a GitHub-Pages-scenario simulation via `localtest.me` (resolves to 127.0.0.1, so `isPublicStaticHost()` is exercised) with the relay URL injected.

### Context
Returning to the project after a break. Goal: review code, fix bugs, deploy to GitHub Pages, and (per owner choice) enable multi-device online multiplayer via a cloud-hosted relay.

### Bugs found and fixed (root-cause)
A multi-dimensional review (win-conditions, role scaling, night/save math, voting, bot AI, render/UI, persistence, networking) with adversarial verification surfaced 10 real issues; fixed:
1. **Voting race (HIGH)** — `confirmVote → processVote` ran before the deferred 700ms bot-vote timer, so in solo only the human's vote counted. Added `ensureBotVotes()` (synchronous) in `processVote`; made bot voting idempotent.
2. **Night race (same class)** — bot Mafia targets/stances were set on the same deferred timer; a fast human night action triggered `processNight` first, so Mafia often never registered a kill. Added `ensureBotNightDecisions()` in `processNight`; idempotent night picks.
3. **Stale bot decisions (med)** — added a phase guard (`if (state.gamePhase !== phase) return;`) at the top of `botMakeDecisions` so a late timer can't write into the next round.
4. **Win-condition ordering (med)** — `humansAlive===0` was checked before `mafiaAlive===0`, mislabeling a legitimate Town win as "Mafia wins" when the last human was the last Mafia. Reordered so decisive Town/Mafia outcomes resolve before the all-humans-eliminated fallback.
5. **Networking for static hosting (HIGH)** — added `scripts/config.js` (`productionRelayUrl`), `getConfiguredRelayUrl()`, `isPublicStaticHost()`. On a public static host the app now uses only the configured `wss://` relay, skips `/api/*` probing (no 404/CORS noise), and solo never probes at all.
6. **Post-open WS watchdog (med)** — added a join-ack timeout so a relay that accepts the socket but never replies can't hang the UI on "Validating room code…".
7. **Cold-start tolerance** — `warmUpConfiguredRelay()` HTTP-pings the relay `/health` before dialing; longer dial timeout on public static hosts.
8. **Mixed content (low)** — on https pages, non-`wss://` relay candidates are filtered out.
9. **Cache hygiene (med/privacy)** — room cache (which holds secret roles) now has a 12h TTL and is cleared on game-over and explicit leave; per-render writes de-duped.
10. **UI peeve (low)** — doctor save-chance % was grey (`--text-secondary`); now primary/bright (important info shouldn't be subdued).

Relay updated for cloud hosting: reads `$PORT`, binds `0.0.0.0`, answers HTTP `GET /health` with 200 (Render health check).

### Results
| Test | Status | Notes |
|------|--------|-------|
| Deterministic fix verification (`ensureBotVotes`, night decisions, phase guard, win order) | PASS | 6/6 assertions, 0 pageerrors |
| Diagnostic full-flow (solo x3 configs + pass-and-play) | PASS | All complete; no console/page errors. Solo games now run longer (mafia actually kill, bots actually vote) |
| Button sweep (`playwright_button_sweep.js`) | PASS | End-to-end solo to game-over, no errors |
| Realtime join guardrails (`playwright_join_guardrails.js`) | PASS | Host/join over relay (relay bound 0.0.0.0) |
| GitHub-Pages simulation (`localtest.me` + injected relay) | PASS | Solo: `isPublicStaticHost()` true, 0 `/api` requests, clean console. Host+Join connect over the configured relay and presence shows 2 devices |
| Relay `$PORT` + `/health` (PORT=9999) | PASS | HTTP 200 on `/` and `/health`; WS handshake creates room |

### Deploy prep
- `.nojekyll`, `render.yaml`, `Procfile`, `DEPLOYMENT.md` added; `requirements.txt` pinned `websockets>=13.0`.
- Static client → GitHub Pages (`master` root). Relay → Render free tier (one-time owner signup), then set `productionRelayUrl` in `scripts/config.js`.

---

## Session 21: Val Town Relay Prep + Spectator Flow + Multiplayer Matrix (2026-06-04)

**Tester:** Claude Code (Opus 4.8)
**Method:** Playwright (headless Chromium) against the local unified backend (`server.py`, relay on 0.0.0.0:8765).

### Changes
- `valtown/mafia-relay.ts` (Deno/TS port of the relay) + `valtown/deploy.py` (stdlib deploy via Val Town REST API). Pending owner's VALTOWN_TOKEN.
- Spectator continuation: solo player death no longer ends the game; it resolves by faction and the player spectates (`evaluateWinCondition` simplified; auto-advance added to day/discussion/announcement/vote modals when no human is alive; spectator banner).
- Fixed stale `waitForConnected` in the 10-run matrix (now uses `state.network.connected`).

### Results
| Test | Status | Notes |
|------|--------|-------|
| Deterministic logic checks (`/tmp/verify_fixes`) | PASS | 6/6; win-condition still correct after simplification |
| Spectator continuation (kill solo human mid-game) | PASS | Auto-plays to a faction win ("Mafia now outnumber Town"), no stall, 0 pageerrors |
| Button sweep | PASS | Full solo flow to game over |
| Join guardrails (realtime) | PASS | Host/join connect, invalid-code rejected, join lobby readiness |
| 10-run matrix | PASS 10/10 | 4 solo + 3 single-device + 3 realtime host/join full games to game-over with state sync |

### Notes
- The matrix realtime runs initially showed 7/10 due to a stale `text=Connection:` readiness selector (the join lobby UI changed in a prior session); fixing the detector to read `state.network.connected` restored 10/10. Real connectivity was never broken (`join_guardrails` passed throughout).

---

## Session 22: Online Multiplayer Live on Deno Deploy (2026-06-06)

**Tester:** Claude Code (Opus 4.8) | **Method:** Playwright (headless Chromium) against the LIVE GitHub Pages site + the deployed relay.

- Val Town WS limitation confirmed live (upgrade -> 200, not 101). Relay deployed to Deno Deploy (native WebSockets) at https://mafia-relay-pycoder42.pycoder42.deno.net.
- `scripts/config.js` points the live site at `wss://mafia-relay-pycoder42.pycoder42.deno.net`.

| Test | Status | Notes |
|------|--------|-------|
| Relay on Deno runtime (local) | PASS | health 200, host/join, presence, action forwarding |
| Deployed relay over wss:// | PASS | health 200 + full handshake/presence/action forwarding |
| LIVE online multiplayer (github.io <-> Deno relay) | PASS 8/8 | 2 browsers host+join over internet, presence=2, host Start synced reveal+3 participants to joiner, 0 pageerrors |
| Live Pages solo + pass-and-play (regression) | PASS | unchanged; clean console |

---

## Session 23: 12-Item Overhaul Verification (2026-06-10)

**Tester:** Claude Code (Opus 4.8) | **Method:** Playwright headless against worktree backend (8001/8766).

| Test | Status | Notes |
|------|--------|-------|
| Deterministic mechanics suite | PASS 12/12 | pod-snoop 92-97% truth on shadowed killer; lock-block ~30%; escape ~22-37%; pod-snoop detection ~55%; stealth .35/.72; Sharp Eyes .245; Deep Cover lowers saves; info snoop .84 vs hide .14; confidence metadata present; morning_doctor gone; QR 480 param |
| Core logic regression | PASS 5/5 | bot votes sync, phase guard, bot doctor-protect + detective-stance picks, win ordering, no pageerrors |
| Button sweep | PASS | new flow end-to-end incl. tutorial skip |
| 10-run matrix | PASS 10/10 | 4 solo + 3 single-device + 3 realtime full games with the redesigned night flow |
| Visual checks | PASS | tutorial, info chips, detective/doctor stances, upgraded map, merged share card, fullscreen Gimkit-style QR (screenshots reviewed) |

Found-and-fixed during verification: pod-snoop missed killer movement when the victim escaped (gate was on attack success, not on the attempt) — watcher now reports the trip regardless of outcome.

### Session 23 addendum: live verification + account rename (2026-06-10)
- GitHub account renamed PyCoder42 → website-and-game-maker; old Pages URL 404s. New live URL: **https://website-and-game-maker.github.io/mafia-game/** (docs + git remote updated; Deno relay URL unchanged and healthy).
- Live (new URL): all 4 pages clean (no pageerrors, no /api probing); solo full game to winner; online multiplayer host+join through the Deno relay with named players on both devices — game start synced, joiner sees all participants (7/7 checks).
- Note: bots-only multiplayer start is correctly blocked by design ("Need at least 1 human") — verified not a regression.

### Session 23 addendum 2: Lobby chat (2026-06-10)
| Test | Status | Notes |
|------|--------|-------|
| Lobby chat focused suite | PASS 12/12 | host↔joiner sync, device attribution, HTML escaped, clears at game start |
| Button sweep | PASS | |
| 10-run matrix | PASS 10/10 | incl. 3 realtime runs |

---

## Session 24: Connection/UX batch (2026-06-10)

**Method:** Playwright headless Chromium vs worktree backend (8001/8765); mobile viewport 390×844.

Fixes (per ERRORS.md): seating-order night turns (role-leak), game-epoch timer guards (death-during-reveal), in-game ?+Terms glossary, auto-host on host.html, always-on chat via mobile-safe 💬 drawer with unread badge, departure flow (host Wait/Remove + 90s auto-remove + win re-check), relay host-grace (75s seat hold; refresh reclaims same room), solo resume card, map pulse hint (callout removed), 👁 Witness-risk separation for mafia (no Snoop tags), narration outcome echoes, humanized room tags.

| Test | Result |
|------|--------|
| Batch suite | PASS 21/21 |
| Host refresh reclaim (live game) | PASS — same room, same game, joiner unaffected |
| Button sweep | PASS |
| 10-run matrix | PASS 10/10 (4 solo + 3 passplay + 3 realtime full games) |
| Mobile shots (host lobby / mafia evening / map) | reviewed, clean |
