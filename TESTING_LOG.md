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
