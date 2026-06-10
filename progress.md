Original prompt: Build and polish this multiplayer-capable mafia web game without changing architecture; create AGENTS.md from CLAUDE.md, recategorize/clean TODOS.md with fixed-vs-tested semantics, expand INSTRUCTIONS.md with full functionality/tutorial details, and implement+test gameplay/UI fixes (risk/intel location actions, mafia/detective/doctor/night flow, pass-and-play wording, snooping options, discussion/voting flow, presets, bot pacing, multiplayer name-entry UX, intel visibility, narration support), using Playwright-based agentic testing and meaningful commits.

## 2026-02-12 - Session start
- Bootstrapped superpowers and loaded required skills (`superpowers:brainstorming`, `superpowers:writing-plans`, `develop-web-game`).
- Audited `CLAUDE.md`, `INSTRUCTIONS.md`, `TODOS.md`, `TESTING_LOG.md`, `scripts/game.js`, `scripts/render.js`, `styles/main.css`, `index.html`.
- Found several requested fixes partially implemented (Enter-key add player, lock/listen options, solo reveal flow), but many gaps remain (intel details/empty intel states, mafia planning clarity, night witness model, discussion flow, role ratio targets, documentation completeness, TODO structure).
- Next: draft execution plan + start docs updates (`AGENTS.md`, `TODOS.md`, `INSTRUCTIONS.md`) before gameplay logic patches.
- Added `AGENTS.md` as repo-level workflow guide (architecture, todo semantics, test/commit policy).
- Rewrote `INSTRUCTIONS.md` to capture full rules + intended gameplay functionality/tutorial coverage without changing core win/role rules.
- Rebuilt `TODOS.md` with impact-first categories and explicit `Fixed`/`Tested` checkboxes; removed standalone completed section.
- Wrote execution plan: `docs/plans/2026-02-12-mafia-game-stabilization.md`.
- Implemented major gameplay and UX updates in `scripts/game.js`, `scripts/render.js`, and `styles/main.css`:
  - role scaling updates (including classic 12-player target 5/3/2)
  - mafia-only planning UI and mafia night visibility model
  - snoop target actions and richer intel output (no empty intel cards)
  - detective lock-in restrictions + lower mafia notice probability
  - probabilistic doctor saves with multi-attacker penalty
  - pass-and-play privacy text updates across phases
  - discussion chat with sender attribution and per-player discussion pass flow
  - narrator mode/tone controls and non-spoiler human narrator panel
  - bot pacing auto-advance states
  - multiplayer Enter behavior keeps focus in name input

## 2026-02-13 - Playwright validation + bugfix
- Resumed testing with Playwright MCP on `http://localhost:8000`.
- Ran full multiplayer round manually:
  - reveal → day planning → night mafia targeting → morning doctor decision → discussion/chat → voting → game over
  - validated pass prompts, mafia target detail cards, intel fallback text, discussion-before-vote sequencing, and winner messaging.
- Found and fixed one bug: doctor phase privacy prompt could be skipped if `showRole` remained true from mafia night console.
  - fix: reset `state.showRole = false` when transitioning into `morning_doctor` in `processNight()`.
- Added targeted regression checks:
  - detective action filtering (no lock action, detective note visible)
  - role-balance safety warning/block when mafia >= town in lobby
  - bot auto-pacing ("Auto-continuing...") and actual auto-advance between phases
  - `calculateRolesFromPreset('classic', 12)` returns `{mafia:5, doctor:3, detective:2, villager:2}`
  - nearby mafia visibility mode returns only local targets
  - detective stealth simulation shows lower detection rate than villager snoopers
- Logged Playwright regression session to `TESTING_LOG.md` (Session 2) with pass/fail detail and one fixed bug.
- Updated `TODOS.md` statuses based on validated behavior.

## 2026-02-13 - Narration + atmosphere implementation pass
- Implemented runtime bot discussion chat behavior (setting-gated) in `scripts/game.js`:
  - bot lines now queue at discussion start and may reply after human messages
  - bot discussion timers are cleaned up on phase/mode transitions
- Implemented visible death animation wiring (setting-gated):
  - `state.deathAnimation` now set on fatal night/vote eliminations
  - announcement/vote modals now render animated victim card when enabled
  - animations clear safely when disabled or leaving announcement phases
- Added robust narrator feed support:
  - `state.narrationLog` captures recent phase-safe narration updates
  - human narrator console now renders a recent feed with day/phase context
- Updated docs:
  - `INSTRUCTIONS.md` now includes bot-chat behavior, narrator feed expectation, and atmosphere toggle requirements
  - `TODOS.md` updated to mark narration/bot chat/sound/death animation items fixed+tested
  - `TESTING_LOG.md` Session 3 added with Playwright evidence for this slice
- Playwright notes:
  - intermittent MCP Chrome profile lock was observed; workaround used (quit/relaunch Chrome) and tests completed successfully.
  - verified chat prominence class and sender attribution selection behavior in discussion (`chat-panel-prominent`, `setChatSender` + `sendDiscussionMessage`).

## 2026-02-13 - Realtime multi-device pass
- Added realtime multiplayer foundation without changing core architecture:
  - `state.multiplayerMode` (`passplay`/`realtime`) and `state.network` session metadata
  - host-authoritative WebSocket sync with presence, state snapshots, and forwarded action requests
  - render hook (`window.afterRender`) broadcasts host state deltas
  - non-host clients suppress local auto-advance timers to avoid duplicate bot progress
- Added local relay server: `scripts/realtime_server.py` (rooms, host election, presence broadcast, state/action forwarding).
- Added runtime dependency in `requirements.txt`: `websockets>=12.0`.
- Multiplayer UI updates in lobby:
  - mode switch (Pass-and-Play vs Realtime), device name/URL fields, connect/disconnect controls
  - connected-device list only shown when device count > 1
  - join-link detection card on setup screen (`?join=CODE`) for direct realtime onboarding
- Debugged/fixed recursion bug in realtime toggle:
  - root cause was global name collision between internal realtime functions and window handlers
  - renamed internals to `connectRealtimeSession` / `disconnectRealtimeSession`
- Playwright Session 4 validated:
  - two-tab host/client presence
  - client lobby actions forwarded to host and synced back
  - host start synced to client game phases
  - client reveal action forwarded correctly

## 2026-02-13 - Project hygiene closure
- Added backup utility script: `scripts/create_backup.sh`.
- Executed backup script and confirmed snapshot archive creation in parent directory:
  - `/Users/saahir/Desktop/Coding/mafia-game-backup-20260212-193953.tar.gz`
- Ran static separation audit:
  - verified HTML/template rendering lives in `scripts/render.js`
  - no UI markup/template strings found in `scripts/game.js`

## 2026-02-13 - Lobby language + discussion flow + narrator visibility pass
- Reworked multiplayer lobby language and behavior:
  - player-facing mode labels now `Single-device` and `Multi-device`
  - single-device mode no longer renders join/share room card
  - multiplayer start validation now allows 2+ players (instead of hard 3+) while preserving mafia-vs-town safety checks
  - share-link generation now handles protocol safely and falls back to room-code copy behavior
- Restored/expanded lobby management UX:
  - player list autoscroll restored when adding many names
  - player reorder controls added (up/down in lobby)
  - help `?` circle glyph styling removed from setup CTA
- Updated discussion and chat flow:
  - single-device discussion now uses a timed (~5s) group discussion gate before voting
  - multi-device discussion no longer uses pass-to-chat prompts
  - multi-device chat panel now renders as an always-visible corner panel during gameplay and becomes read-only outside discussion
- Added vote tally output to vote announcement text.
- Added narrator-facing visibility and prompts:
  - narrator quick mode controls now visible in lobbies/game (not only deep settings)
  - human narrator phase cue card rendered per phase (non-personalized, role-safe)
  - multi-device human narrator now auto-injects one narrator chat cue per phase key (`day/phase`) without spoilers
- Added device-awareness groundwork:
  - players now track `deviceId`/`deviceName`
  - active device banner shows whose device turn is currently up in multi-device play
  - realtime `addPlayerFromInput` forwarding now carries requesting device id for proper ownership tagging
- Documentation updates:
  - `INSTRUCTIONS.md` modes + narration language updated to instruction-first framing and explicit human-narrator turn semantics
  - `AGENTS.md` expanded with localhost startup checks, Playwright tunnel fallback notes, and current project non-negotiables
  - `TODOS.md` updated with newly requested items + many changed items marked `🔧 Fixed` pending full browser validation
- Testing status:
  - JS syntax checks pass (`node --check scripts/game.js`, `node --check scripts/render.js`).
  - Playwright MCP currently blocked by environment connectivity (`ERR_CONNECTION_REFUSED` to localhost and unstable browser-context closure states).
  - Added Session 6 in `TESTING_LOG.md` documenting exact blocker and fallback attempts.

## 2026-02-13 - Geography + exposure + night-system overhaul (coding-first)
- Implemented new map/data layers:
  - added `scripts/geography_data.js` with node/edge graphs for all four settings (distance/sight/hearing edge metadata).
  - added `scripts/narration_data.js` with story backstory packs and phase narration templates.
  - wired both into `index.html` ahead of `game.js`.
- Reworked gameplay model around unified Exposure:
  - converted location/action generation to graph-driven locations with `exposure` percentages.
  - replaced risk/intel split presentation with Exposure-based values and gradient rendering.
  - expanded each setting to map-driven multi-location sets (beyond 4 locations).
- Reworked day/night systems:
  - snooping is now location-first (investigation zones + target action).
  - bedroom behavior now uses action set (`sleep and lock`, `sleep without locking`, `porch watch`) with shared bedroom zones.
  - removed old door-option prompt flow.
  - removed broken `coordinate strike` mafia action path.
  - mafia actions now location-based and less visually over-signaled.
- Implemented night strike + medicine interaction:
  - mafia chooses target + kill method (`Silent Blade`, `Stranglehold`, `Toxin Dose`, `Incendiary Burst`).
  - doctors choose a night medicine loadout, then morning save target.
  - save odds now depend on attack method, medicine matchup, and attacker count.
  - morning announcements include cause-of-death/method context.
- Implemented graph-based witness/intel behavior:
  - mafia target visibility uses graph distance (nearby-first, search fallback).
  - nearby witness logic now distance-based and noise-aware.
  - detectives keep stealth advantage and stronger clue output.
  - inconclusive fallback text guaranteed (including locked/sleep outcomes).
  - mafia tactical feed now includes snooper-room intelligence summaries.
- Multiplayer flow additions:
  - added device-order state and host-side device reorder controls in multi-device lobby.
  - synced device order in realtime snapshots and kept active-device banner behavior.
- Preset/copy/UX updates:
  - presets differentiated (`Classic`, `Blood Moon`, `Aftershock`, `Forensics`).
  - detective helper copy changed to always-alert semantics.
  - removed circular `?` icon treatment and toned down mafia-specific red emphasis.
  - increased default bot pacing (`botDelayMs` now 1200ms; slider range 700-2600ms).
- Documentation updates in this slice:
  - rewrote `INSTRUCTIONS.md` to match implemented exposure/geography/night method+medicine flow.
  - expanded `AGENTS.md` with new data files and localhost + local Playwright method notes.
  - updated `TODOS.md` status flags (many items moved to `🔧 Fixed | [ ] Tested`).

Pending after this coding-first slice:
- full Playwright regression pass and TESTING_LOG updates (deferred intentionally per user instruction to finish coding first).
- Added repeatable sanity script `scripts/run_quick_checks.sh` and ran it successfully (syntax + localhost smoke).
- Re-ran architecture boundary audit (`rg "<[a-zA-Z]" scripts/game.js scripts/render.js`) and confirmed markup remains in `render.js`.
- Added multiplayer connection guide copy in lobby (local-network vs file-mode vs internet relay guidance) to reduce localhost-only dead-end confusion.

## 2026-02-13 - Full local Playwright sweep + follow-up fixes
- Ran full button sweep via localhost method:
  - `python3 -m http.server 8000`
  - `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
- Added/kept repeatable automation script: `scripts/playwright_button_sweep.js`.
- Ran additional multi-device control pass with realtime relay:
  - `python3 scripts/realtime_server.py --port 8765`
  - verified Connect/Host/Join/Copy/Disconnect controls.
- Found and fixed 3 runtime issues during testing:
  1. Clipboard permission pageerror in `copyLink()` -> added try/catch + fallback copy implementation.
  2. Mode-switch websocket error spam (auto-connect on switching to multi-device) -> connect is now explicit unless join-code flow.
  3. Name-entry focus drop after Enter -> strengthened focus restore with `requestAnimationFrame` + short timeout.
- Re-ran full sweep + targeted assertions after fixes; all passes with no console/page errors.

## 2026-02-13 - 33-item lobby/gameplay/narration refactor pass (coding before browser test)
- Rebuilt TODO tracker first per request:
  - replaced `TODOS.md` with active-only 33-item list + separate major-overhaul placeholder
  - marked implemented items as `🔧 [x] Fixed | [ ] Tested` pending regression run
- Multiplayer lobby + mode UX overhaul (`scripts/render.js`, `scripts/game.js`):
  - removed player-facing websocket URL controls
  - added explicit host/join panel flow in multi-device mode
  - added room code + generated join portal URL + hotlink UI
  - added file-path aware join URL generation (`join.html` support)
  - added `join.html` entry page
  - grouped players by device, separated bot list, host-only bot add/remove guard
  - added bot rename inputs
  - switched reorder UX from arrows to drag-handle drag/drop for devices and players
- Device naming + relay updates:
  - changed device default to `Device 1`
  - added server-side sequential default assignment (`scripts/realtime_server.py`) for default-like names
  - synced assigned device names back through presence handling in client state
  - added relay candidate auto-fallback (`localhost` / `127.0.0.1` / hostname) in websocket connect path
- Gameplay flow updates:
  - removed doctor medicine system completely from state/logic/UI
  - added non-mafia night stance system (`NIGHT_AWARENESS_OPTIONS`) and enabled villager/detective/doctor night turns
  - morning doctor now chooses save target only; save chance uses attack profile + attacker count
  - changed mafia win condition from parity to strict outnumber (`mafia > town`)
  - delayed game-over declaration until after announcement/vote-announcement flow resolves
- Mafia/intel/map presentation updates:
  - added location-specific mafia route action generation (no shared generic 3-option everywhere)
  - sorted action lists and attack methods low->high by displayed percentage
  - relabeled kill-method display to `Disturbance` wording
  - improved mafia target intel readability and snooper phrasing
  - differentiated Prometheus `Cargo Hold` vs `Reactor Tunnel` exposure values in geography data
  - added in-game map toggle button + visual map modal
- Narration/help/instructions updates:
  - rewrote narrator quick hint text to narrator-turn wording
  - updated narrator cue card wording for single-device verbal vs multi-device chat
  - kept help `?` visible in gameplay header and removed icon focus ring artifact in CSS
  - merged in-game instructions tabs into `Rules + Gameplay` and `Modes`
  - fully rewrote `INSTRUCTIONS.md` for current flow (exposure definition, anti-assumption discussion rule, no medicine, night stances, strict outnumber win threshold)
  - updated `scripts/narration_data.js` to remove technical sci-fi day phrase
- Documentation/process updates:
  - updated `AGENTS.md` for host/join page split, active-only TODO convention, and new multiplayer UX expectations
- Static verification completed (no browser execution yet in this pass):
  - `node --check scripts/game.js`
  - `node --check scripts/render.js`
  - `python3 -m py_compile scripts/realtime_server.py`

## 2026-02-13 - Single-checkbox TODO format + narrator-first phase gate (no testing pass)
- Updated `TODOS.md` status semantics to one checkbox only:
  - `[ ]` = not implemented
  - `[x]` = implemented
  - remove item after thorough testing
- Kept all 33 active-request items present and marked implemented (`[x]`), with no Playwright/browser testing in this pass by explicit instruction.
- Aligned agent guidance to the same format in `AGENTS.md` (removed old two-checkbox references from TODO rules and workflow notes).
- Implemented enforced narrator-first gating across phases in `scripts/game.js` + `scripts/render.js`:
  - added `pendingNarratorPhase` state and phase priming helpers
  - phase entry now requires narrator acknowledgement before player turns continue
  - applies to reveal/day/night/morning/announcement/discussion/vote/vote-announcement in human narrator mode
  - added `completeNarratorTurn()` handler and realtime action forwarding support for it
  - ensured vote-announcement now also queues narrator chat cue in multi-device mode
- Updated `INSTRUCTIONS.md` narration section to document that narrator cue is acknowledged before player turns continue.

## 2026-02-13 - TODO recategorization + lobby reliability polish
- Re-categorized `TODOS.md` from raw uncategorized notes into explicit priority buckets while preserving the full human-written raw list.
- Updated `AGENTS.md` priority taxonomy to match current owner scheme:
  - Priority-3 `Feature Addition`
  - Priority-4 `Multiplayer Management`
  - Priority-5 `Polishing`
- Implemented lobby/realtime UX fixes:
  - added `network.statusDetail` guidance text for offline/connecting/connected states
  - added `joined_room` message handling to sync room code/detail status
  - added host `Show Large` room-code modal (`showBigRoomCode`/`hideBigRoomCode`)
  - removed redundant setup-screen `?` icon (How to Play button remains)
  - added focus persistence in `render()` to keep text inputs active across rerenders (fixes device rename focus-drop case)
- Synced docs:
  - `INSTRUCTIONS.md` now mentions large room-code display and connection guidance behavior in multi-device mode.
- Validation completed:
  - `bash scripts/run_quick_checks.sh` (PASS)
  - `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js` (PASS)
  - targeted Playwright script for setup icon removal + large room-code modal + focus persistence (PASS)
  - targeted two-page realtime host/join connectivity script with relay server (PASS: host/join both `Connection: Connected`)
- Updated `TESTING_LOG.md` with Session 9 details for this pass.

## 2026-02-13 - Major overhauls closed + full 10-run validation
- Completed both major overhauls:
  - project split into entry portal + separated flow pages (`index.html`, `host.html`, `join.html`, `game.html`) with flow bootstrap scripts (`scripts/flow_host.js`, `scripts/flow_join.js`, `scripts/flow_game.js`)
  - floorplan map presentation implemented with per-floor SVG assets and room/connection annotations from `scripts/geography_data.js`
- Updated automated test tooling for the new flows:
  - fixed `scripts/playwright_ten_run_matrix.js` selectors and progression logic (`Reveal My Role`, stall detection, modern preamble)
  - updated `scripts/playwright_button_sweep.js` for portal navigation and current gameplay controls (removed obsolete medicine checks)
- Executed validation runs:
  - `bash scripts/run_quick_checks.sh` -> PASS
  - `NODE_PATH=$(npm root -g) node scripts/playwright_ten_run_matrix.js` -> PASS (`10/10`)
    - 4 solo runs
    - 3 single-device pass-and-play runs
    - 3 realtime host/join runs
  - `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js` -> PASS
- Documentation alignment updates:
  - `INSTRUCTIONS.md` updated for floorplan map behavior and explicit portal/entry-page model
  - `AGENTS.md` updated for new page/script layout and floorplan asset expectations
- TODO lifecycle cleanup:
  - removed tested categorized items
  - removed checked raw uncategorized items after verification
  - reset `TODOS.md` to active-only sections with no remaining items
- Logged this validation in `TESTING_LOG.md` as Session 10.

## 2026-02-14 - Final priority closure + Playwright-only verification
- Re-aligned app entry and flow pages with the latest request:
  - `index.html` remains the main in-app setup entry (solo/multiplayer)
  - `host.html` remains host-focused with host-only lobby behavior
  - `join.html` and `game.html` are lightweight redirects into the main app URL flow
  - removed obsolete flow bootstrap scripts (`scripts/flow_host.js`, `scripts/flow_join.js`, `scripts/flow_game.js`)
- Completed and validated requested UI/UX fixes:
  - back navigation behavior from multiplayer/flow pages
  - removed visible `?` focus/border artifact with stronger button-state CSS overrides
  - standardized copy interactions for room code, join portal URL, fast link, and QR-click shortcut
  - removed low-contrast critical lobby text and preserved subdued tone for footnotes only
  - removed classic 12-player helper line from role config UI
  - updated in-app modal labeling to `Instructions` + explicit variant-warning subheader
  - expanded `INSTRUCTIONS.md` substantially as a detailed Mafia-variant guide
- Completed major multiplayer overhaul requirements:
  - host/join split in multiplayer panel on `index.html`
  - prominent join-code input for join flow
  - host-only controls on host page (no join controls)
  - grouped players-by-device section with host remove-device control
  - host-only bot management behavior retained
  - large room-code modal now includes join portal URL
  - removed regenerate-code control
  - room-code collision guard validated across concurrent host contexts
  - URL state + local cache persistence retained for refresh resilience
- Fixed realtime edge-case bug found during testing:
  - kicked-client status was overwritten on socket close; updated close handler to preserve host-removal state message.
- Hardened Playwright automation for dynamic rerenders:
  - updated click helpers in `scripts/playwright_ten_run_matrix.js` and `scripts/playwright_button_sweep.js` with short-timeout click + dispatch fallback.
- Final verification (Playwright only):
  - targeted requirement suite: `17/17 passed`
  - full button sweep: `PASS`
  - 10-run matrix on final code state: `10/10 passed`
- Lifecycle cleanup:
  - removed fully tested categorized TODO items
  - removed verified raw uncategorized notes
  - left `TODOS.md` active-only with no pending items.

## 2026-02-14 - Active TODO closure (settings-math + absolute URL share)
- Added/finished active TODO implementation:
  - ensured share URL generation stays absolute HTTP(S) in host UI (`scripts/game.js`), including join portal + fast join link.
  - finalized LAN-preferred share hint consumption via `/api/network-info` and kept advanced alternates in host share card.
  - completed settings-overhaul slice with explicit environment profile rule impacts surfaced in read-only join setup summary (`scripts/render.js`).
  - aligned docs (`INSTRUCTIONS.md`) to state that presets are role-only templates while Environment Rules in Settings modify real gameplay calculations.
- Added targeted Playwright suite `scripts/playwright_active_todos.js` to validate all currently active TODO requirements end-to-end.
- Fixed realtime relay compatibility issue in `scripts/realtime_server.py` by removing version-fragile protocol import and using version-tolerant protocol typing.
- Playwright verification completed:
  - `node scripts/playwright_active_todos.js` -> PASS
  - `node scripts/playwright_join_guardrails.js` -> PASS
  - `node scripts/playwright_button_sweep.js` -> PASS
  - `node scripts/playwright_ten_run_matrix` -> PASS (`10/10`)
- Removed tested active items from `TODOS.md` per active-only rule.

## 2026-02-19 - Networking major-overhaul + full TODO closure
- Updated `TODOS.md` first with new owner directives:
  - LAN-safe backend hosting preference
  - auto fallback to current origin when LAN unavailable
  - static-host (VS Code Live Server) offline diagnosis handling
  - QR interaction constraints (no extra copy button, no draggable image)
- Implemented networking-overhaul logic in `scripts/game.js`:
  - added networking share modes (`lan`, `origin`, `custom`) in settings state
  - added backend/LAN detection fields in `state.network.shareHints`
  - upgraded `/api/network-info` handling with LAN/origin parsing and fallback behavior
  - LAN mode now auto-falls back to origin when LAN unavailable
  - relay candidate generation now supports mode-based and custom relay URLs
  - static-host connection failures now show explicit `python3 server.py` guidance
- Implemented UI changes in `scripts/render.js` + `styles/main.css`:
  - networking settings section with LAN/Same URL/Custom mode buttons + advanced details
  - LAN option grayed out/disabled when unavailable
  - solo mode now hides Human narrator option in both quick controls and settings modal
  - Host Game + Disconnect actions promoted visually (larger buttons)
  - QR section now uses click-only tile (`title="Click to copy"`), removed separate QR copy button, no `<img>` drag/save behavior
- Extended backend API payload in `server.py` with explicit `originPortalUrl`, `lanPortalUrl`, and detection metadata.
- Added targeted Playwright suites:
  - `scripts/playwright_network_overhaul_checks.js`
  - `scripts/playwright_device_name_sequence.js`
- Validation completed:
  - static-host diagnosis check PASS
  - backend networking check PASS
  - join guardrails PASS
  - button sweep PASS
  - device sequence PASS
  - 10-run matrix PASS (`10/10`)
- Cleared all tested TODO items and returned `TODOS.md` to active-only with no pending entries.

## 2026-02-14 - Dedicated host/join/solo pages + unified Python backend
- Updated TODOs first with new owner directives, then implemented page split and backend changes.
- Routing/page-flow changes:
  - `index.html` remains launcher/setup and now sends Multiplayer into a dedicated two-choice page (`Host Game`, `Join Game`) before entering lobby pages.
  - `join.html` converted from redirect to full independent app shell.
  - added `solo.html` as full independent solo app shell.
  - `host.html` remains host-only and does not expose join-entry controls.
- Game/runtime changes (`scripts/game.js`, `scripts/render.js`):
  - added entry-page detection for `host`, `join`, and `solo` paths.
  - adjusted defaults so each page opens its own correct flow (`multi_lobby` host/join, `solo_lobby` solo).
  - updated index multiplayer behavior to show only host/join choice page.
  - changed share/join portal generation to use `join.html`.
  - removed fast-link label text `Direct hotlink (joins this room)`.
  - added direct navigation handlers (`goToHostPage`, `goToJoinPage`) and entry-aware reset behavior.
- Added unified backend launcher:
  - new `server.py` runs static HTTP + realtime relay together.
  - auto-selects project venv Python for relay to avoid system-package install blockers.
  - keeps HTTP available even if relay startup fails and prints actionable status.
- Realtime stability fix after backend-run observation:
  - fixed `scripts/realtime_server.py` broadcast iteration to use a snapshot list and avoid `Set changed size during iteration` during disconnect cleanup.
- Documentation alignment:
  - updated `AGENTS.md` quick-start and layout sections for `server.py`, `solo.html`, and real `join.html`.
- Playwright validation:
  - `scripts/playwright_button_sweep.js` updated for new routing and passes.
  - `scripts/playwright_ten_run_matrix.js` updated for `solo.html` transition and passes (`10/10`).
  - targeted Playwright checks confirmed the new index multiplayer choice behavior, host-only no-join behavior, join/solo page independence, and hotlink-text removal.
- Cleanup:
  - removed tested items from `TODOS.md` and cleared raw uncategorized notes.

## 2026-02-14 - Join flow hardening + portal URL cleanup + Playwright retest
- Updated TODOs first with new directives, then implemented/fixed:
  - join-code input stability on `join.html` (`#joinCodeInput` restored in join-entry + join-lobby rendering path)
  - relay-side invalid join rejection (`scripts/realtime_server.py` now blocks non-host joins to unknown room codes)
  - join connection state semantics (client now marks connected only after `joined_room` ack)
  - in-session code lock for joiners (read-only join code while connected)
  - strict join-only lobby controls (`join.html` hides host/single-device toggles and setup editing)
  - read-only setup detail cards on join lobby (selected setting + rule-impact details, selected preset if present, role counts)
  - drag reorder restricted to `📱 Your Device`; removed drag handles from `🧩 Devices and Players`
  - removed legacy helper text (`This page is locked to multi-device mode.` and `Hover to see the underline.`)
  - preset copy updated to role-balance-only wording (removed loud/noise implication text)
  - host portal URL generation changed to clean portal base URL (no `join.html` shown)
- Additional reliability fixes found during verification:
  - restored missing `renderJoinEntry()` and `join_entry` render branch in `scripts/render.js` (blank join page regression)
  - preserved `entryPage` and `realtimePanelMode` during host snapshot apply to keep join pages in join-only mode after sync
  - restored missing `solo.html` by syncing from `solo 2.html` so routed solo entry resolves
- Playwright verification completed:
  - `scripts/playwright_join_guardrails.js` -> PASS
  - `scripts/playwright_button_sweep.js` -> PASS
  - `scripts/playwright_ten_run_matrix` -> PASS (`10/10`)
- `TESTING_LOG.md` updated with Session 13 details.
- `TODOS.md` cleared for this verified slice.

## 2026-02-20 - Backend autoswitch + API resilience

- Added frontend local-backend recovery in `scripts/game.js`:
  - local/static origins now probe local backend candidates on port `8000`
  - when backend is detected on a different local origin, app auto-switches to backend URL (`index.html` / `host.html` / `join.html` / `solo.html` preserved)
  - backend-missing messaging updated to match auto-recovery behavior (removed hardcoded `python3` prompt text)
- Extended backend API behavior in `server.py`:
  - CORS headers for `/api/*` responses
  - new `/api/ensure-backend` endpoint (ensures relay process is running)
  - new `/api/health` endpoint
  - `/api/network-info` now includes relay status (`relayRunning`)
- Updated networking instructions in `INSTRUCTIONS.md` to describe local backend auto-switch behavior.
- Updated Playwright coverage in `scripts/playwright_network_overhaul_checks.js`:
  - static-host no-backend mode
  - static-host autoswitch mode (`EXPECT_AUTOSWITCH=1`)
- Logged verification in `TESTING_LOG.md` (Session 16).

Validation executed:
- `node --check scripts/game.js`
- `node --check scripts/render.js`
- `python3 -m py_compile server.py scripts/realtime_server.py`
- `EXPECT_STATIC=1 ... node scripts/playwright_network_overhaul_checks.js` (PASS)
- `EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1 ... node scripts/playwright_network_overhaul_checks.js` (PASS)
- `MAFIA_BASE_URL=http://127.0.0.1:8000 ... node scripts/playwright_network_overhaul_checks.js` (PASS)
- `... node scripts/playwright_join_guardrails.js` (PASS)
- `... node scripts/playwright_button_sweep.js` (PASS)

Notes:
- Browser sandbox still cannot directly spawn OS processes from JS. Auto-recovery is implemented via local backend detection + origin switch when backend is reachable.

## 2026-02-20 - Host click recovery + share-link safety pass

- Added host-click recovery flow in `scripts/game.js`:
  - `hostRealtimeRoom()` is now async and attempts backend ensure/recovery before websocket room connect.
  - Added `fetchEnsureBackendPayload()` + `ensureBackendForHostClick()` to call backend ensure API and redirect to backend host URL when needed.
- Hardened share URL logic in `scripts/game.js`:
  - Added loopback/local-only host detection and shareable portal filtering.
  - `getJoinPortalUrl()` now returns only network-shareable portal URLs (prevents exposing `127.*` / `localhost` as multiplayer join portal).
  - Alternates list now filters non-shareable local-only URLs.
- Simplified user-facing multiplayer copy:
  - non-technical room-service guidance in `scripts/game.js` and `scripts/render.js`.
  - join/fast-link placeholders now show "Available after room service starts".
- Updated Playwright checks (`scripts/playwright_network_overhaul_checks.js`) for:
  - static-mode localhost link suppression
  - updated host-click failure copy expectations
  - backend-mode check rejecting localhost/127 portal URLs.
- Updated docs (`INSTRUCTIONS.md`) to reflect host-click automatic room-service setup language.
- Logged verification in `TESTING_LOG.md` Session 17.

## 2026-02-24 - Join retry lifecycle fix + major-overhaul closure

- Continued and completed the active major-overhaul item in `TODOS.md`.
- Implemented realtime connect-attempt lifecycle hardening in `scripts/game.js`:
  - added `connectAttemptId` + pending socket/timer tracking on `realtime`.
  - added `cancelRealtimeConnectAttempt()` + pending cleanup to prevent stale websocket callbacks from prior join attempts.
  - updated `connectRealtimeSession()` with stale-attempt guards across timeout/open/message/error/close handlers.
  - host/join actions now clear active `connecting` attempts before retrying.
  - updated host connected copy to remove legacy “direct hotlink” phrase.
- Updated guardrail automation in `scripts/playwright_join_guardrails.js`:
  - replaced deprecated post-join `Connection:` visibility assumption with join-lobby readiness checks.
  - added explicit wait helpers for invalid-code rejection and joined-lobby detection.
  - aligned assertions with current join UX (join code input hidden after successful join).
- Validation run (Playwright + static/backend split):
  - backend mode: `scripts/playwright_network_overhaul_checks.js` PASS
  - backend mode: `scripts/playwright_join_guardrails.js` PASS
  - regression sweep: `scripts/playwright_button_sweep.js` PASS
  - static mode without backend (`EXPECT_STATIC=1`) PASS
  - static mode with backend autoswitch (`EXPECT_STATIC=1 EXPECT_AUTOSWITCH=1`) PASS
- Updated tracking:
  - appended Session 18 in `TESTING_LOG.md`.
  - removed tested major-overhaul entry from `TODOS.md` (now no active items).

Note:
- Browser JS still cannot directly spawn `server.py`; host flow now aggressively auto-recovers via backend ensure/probe and origin autoswitch whenever a local backend is reachable.

## 2026-03-09 - Host failure recovery path

- Reproduced the reported host failure and isolated it to the no-backend case:
  - `Host Game` succeeds when `server.py` is already running.
  - `Host Game` fails only when the page is running without a local room-service/backend process.
- Added a failing Playwright check first in `scripts/playwright_network_overhaul_checks.js` requiring a room-service starter affordance in the static no-backend error state.
- Implemented the recovery path:
  - `scripts/game.js`
    - added starter URL helpers (`getRoomServiceStarterLinks()`) and host error-state gating (`shouldShowRoomServiceStarter()`).
    - updated host-side missing-backend error copy to point to the starter flow.
  - `scripts/render.js`
    - added `Room Service Starter` card for failed host attempts on non-join clients.
  - `styles/main.css`
    - added support card layout styles.
  - `server.py`
    - added `--open-page` so launchers can bring up `host.html` automatically after backend startup.
  - new files:
    - `start_room_service.command`
    - `start_room_service.bat`
- Visual inspection:
  - manually inspected the static host failure page with Playwright browser tools and confirmed the new recovery card and starter links render after the error.
- Verification:
  - static no-backend: `scripts/playwright_network_overhaul_checks.js` PASS
  - starter launcher: `./start_room_service.command` starts backend successfully
  - backend mode: `scripts/playwright_network_overhaul_checks.js` PASS
  - join guardrails: PASS
  - button sweep: PASS
  - static autoswitch with backend available: PASS

Note:
- A browser page still cannot directly execute Python. The practical fix shipped here is a one-click local starter that opens the proper host page and removes the need to type `python3 server.py`.

## 2026-06-03 - Return pass: bug review, fixes, and GitHub Pages + online-relay deploy
- Resumed in Claude Code after the Codex build sessions. Reviewed code, fixed bugs (systematic-debugging), and prepared deployment.
- Owner decision: enable multi-device online multiplayer by hosting the relay online (Render), since a static page can never spawn a local `server.py` (the long-running pain point). GitHub Pages serves the static client; the cloud relay handles rooms.
- Bug fixes (see TESTING_LOG Session 20 for the verified list): solo voting race (bot votes were dropped), the same race in the night phase (mafia often never killed), a `botMakeDecisions` phase guard, win-condition ordering (Town win mislabeled as Mafia), realtime networking rework for static hosting, a post-open WS ack watchdog, cold-start warm-up, mixed-content filtering, room-cache TTL/cleanup (privacy), and the grey doctor save-chance text.
- New: `scripts/config.js` (`productionRelayUrl`), `.nojekyll`, `render.yaml`, `Procfile`, `DEPLOYMENT.md`. `scripts/realtime_server.py` now reads `$PORT`, binds `0.0.0.0`, and serves `GET /health` 200. `requirements.txt` pinned `websockets>=13.0`.
- Verified with Playwright: deterministic fix checks, full solo + pass-and-play flow, button sweep, realtime join guardrails, and a GitHub-Pages-scenario simulation via `localtest.me` with the relay URL injected (solo clean + no `/api` probing; host/join connect and sync over the configured relay).

## 2026-06-04 - Val Town relay prep + spectator continuation + multiplayer validation
- Owner switched the online relay target from Render to Val Town (already used in another project). Researched Val Town: HTTP vals support server-side WebSockets via Deno.upgradeWebSocket; REST API (Bearer token, val:write) at api.val.town with v2 vals + files endpoints.
- Ported scripts/realtime_server.py faithfully to a Deno/TypeScript Val Town HTTP val: `valtown/mafia-relay.ts` (same host-authoritative protocol; GET /health -> 200; in-memory rooms, correct for a single warm isolate / low-concurrency party game).
- Added `valtown/deploy.py` (stdlib-only) to create/update the val and print its wss:// endpoint for scripts/config.js. Requires a VALTOWN_TOKEN (the one credential the owner must supply).
- Game-flow logic fix (spectator continuation): the solo player dying no longer ends the game with an illogical "Mafia wins (all humans eliminated)." evaluateWinCondition now resolves ONLY by faction (all mafia dead -> Town; mafia outnumber -> Mafia). The eliminated solo player spectates while the bots play it out; added auto-advance for the day (dead turn), discussion, and announcement/vote modals when no human is alive, plus a "You were eliminated — watching how it plays out" banner. This completes the spectator design the codebase already half-implemented (skipDeadVote existed).
- Fixed stale test rot in scripts/playwright_ten_run_matrix: waitForConnected now reads the authoritative state.network.connected (the visible "Connection:" line differs between host panel and join lobby).
- Transcript audit: confirmed the full set of historical requests (one Feb-13 Codex session, ~23 distinct asks) and verified the concrete removal/rename items are all done (no `?` border, no "Classic target"/"Hover to see the underline"/"This page is locked"/"Direct hotlink"/"Read This Full Variant", no "* 2" duplicate files; Instructions modal, back nav, QR click-to-copy, copy buttons present).
- Validation (Playwright): deterministic logic checks PASS; spectator continuation auto-resolves to a faction win with no stall/errors; button sweep PASS; 10-run matrix 10/10 (4 solo + 3 single-device + 3 realtime host/join full games).
- Pending: owner provides a Val Town API token; then deploy.py runs, the wss:// URL goes into scripts/config.js, and online multiplayer is verified on the live GitHub Pages site.

## 2026-06-06 - Online multiplayer LIVE on Deno Deploy
- Confirmed Val Town cannot host a WebSocket relay (HTTP vals don't accept WS upgrades; live upgrade returns 200 not 101). Pivoted to Deno Deploy (native Deno.upgradeWebSocket) per owner's choice.
- Deployed the relay to Deno Deploy via the built-in `deno deploy` CLI (new console.deno.com platform): org `pycoder42`, app `mafia-relay-pycoder42`, region `global`, runtime-mode dynamic, entrypoint relay.ts. Live at https://mafia-relay-pycoder42.pycoder42.deno.net.
- `scripts/config.js` productionRelayUrl -> wss://mafia-relay-pycoder42.pycoder42.deno.net; pushed; GitHub Pages rebuilt.
- Removed dead `valtown/` (relay handler now self-contained in `deno-deploy/relay.ts`); rewrote `deno-deploy/deploy.sh` for the new platform; org/app recorded in `deno-deploy/deno.jsonc`.
- Verified the deployed relay over wss:// (health 200, host/join, presence, action forwarding) AND end-to-end on the LIVE github.io site: two browsers host+join+sync a game start through the relay over the internet (8/8 checks, 0 errors).

## 2026-06-10 - 12-item gameplay/UX overhaul (night stances, intel, presets, join UX, map, tutorial)
- Owner submitted 12 items ("check before assuming broken"). Audited each with file:line evidence (6 via parallel agents, 6 by direct reading), then implemented:
  1. Gimkit-style joining: host's join-URL row now shows the auto-join fast link; duplicate Fast-Join card folded away; QR button + QR tile open a fullscreen projector view (giant code + 480px QR + link, light background).
  2. Preset types split: Ratio presets (role counts) + new Gameplay presets (Standard / Sharp Eyes / Paranoid House / Deep Cover) wired through real rule math via getGameplayMod(); both shown in join read-only summary.
  3. Information values: real per-action `info` stat (snoop .82 / linger .52 / routine .3 / hide .15 blended with location traffic); getPlanIntelChance consumes info, not exposure; 🔍 Info chips on every location/action card (incl. per-role detective bonus), ⚠️ Exposure relabeled.
  4. Lock/exit mechanics + honest descriptions: resolveBedroomDefense — locked = ~30% break-in abort (loud either way; trapped −8% save if breached); unlocked = quiet entry but ~22-37% escape (alert neighbor helps); porch watch = no quiet approach. Descriptions state exactly these tradeoffs. Morning announces blocked/escaped outcomes.
  5. Detective pod-snoop: targeted snoops are dedicated (no random dilution); shadowing one person yields near-certain truth about THAT person (97% det/90% other, incl. "slipped out toward victim" when they're a killer, regardless of attack outcome); detection proximity-gated (mafia within 1 of watched room; pod-snoop detection .55 det/.85 other).
  6. Reliability labels: INTEL_RELIABILITY {confirmed .97, likely .78, uncertain .55} drives BOTH name-accuracy generation and the ✅/🟡/⚠️ chips; killer names now drawn from ACTUAL attackers; false_lead implemented (plants uncertain-tier decoys near the planting site).
  7. Detective stealth verified real (.35 vs .72 seen; −18% exposure; +14% intel) and copy rewritten to the real numbers.
  8. Night-stance redesign: EVENING = where you go; NIGHT = role-flavored stance turns — mafia strike console, detective shadow/sweep/lay-low, doctor picks who to protect AS their stance (morning_doctor phase deleted → no doctor identity leak), villagers awareness.
  9. Discussion chat: prominent chat panel embedded in the discussion view (multi-device).
  10. Map: node-type icons, exposure heat bars, "📍 you are here", legend, polished copy; one-time map pointer callout at game start.
  11. Intel generation broadened (movement-watcher channel; victim personal outcomes; pod-snoop independent of victim) — "no one got intel" addressed at the root.
  12. First-run 5-step tutorial overlay (localStorage-gated, skippable, replayable from Instructions).
- Tests updated: sweep/matrix seed tutorial localStorage; stale doctor-phase clicks removed; matrix waits unchanged.
- Validation: 12/12 deterministic mechanic checks; core-logic regression (bot votes/phase guard/night picks/win order); button sweep PASS; 10-run matrix 10/10 (4 solo + 3 passplay + 3 realtime). INSTRUCTIONS.md rewritten for new flow.

### 2026-06-10 addendum
- GitHub account renamed (PyCoder42 → website-and-game-maker): live site moved to https://website-and-game-maker.github.io/mafia-game/ (old URL 404s). Docs + git remote updated. Live verification re-run on the new URL: 19/19 page+solo checks and 7/7 online-multiplayer checks green.
- Also removed an accidentally-committed venv symlink (had broken one Pages build).
