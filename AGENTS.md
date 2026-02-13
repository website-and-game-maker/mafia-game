# Mafia Game Agent Guide

This file explains how coding agents should work in this repository.

## Project Goal

Build a browser-based Mafia game with:
- location-based geography + exposure gameplay
- solo and multiplayer support
- compatibility across multiple devices
- a clear, testable day/night/discussion/vote loop

Do not rewrite the architecture unless explicitly approved.

## Quick Start

```bash
cd mafia-game
python3 -m http.server 8000
# Optional for realtime multi-device mode:
# python3 scripts/realtime_server.py --host 0.0.0.0 --port 8765
# Host flow: open http://localhost:8000
# Join flow: open http://localhost:8000/join.html
```

## Repository Layout

```
mafia-game/
├── index.html           # Host entry point
├── join.html            # Join-focused entry point
├── styles/main.css      # Styling
├── scripts/
│   ├── game.js          # State, game logic, event handlers
│   ├── render.js        # UI rendering functions
│   ├── geography_data.js # Story map graphs (nodes/edges/sight/hearing)
│   ├── narration_data.js # Story narration packs/backstory templates
│   ├── realtime_server.py # WebSocket relay for realtime multi-device sync
│   ├── run_quick_checks.sh # Repeatable syntax + localhost smoke checks
│   └── create_backup.sh # Creates timestamped tar.gz snapshot in parent directory
├── AGENTS.md            # Agent workflow (this file)
├── CLAUDE.md            # Historical project overview
├── INSTRUCTIONS.md      # Player rules + full gameplay behavior
├── TODOS.md             # Prioritized, status-tracked task list
├── TESTING_LOG.md       # Test session records
└── progress.md          # Ongoing implementation/testing notes
```

## Architecture

Single global `state` in `scripts/game.js` controls all game data and phase transitions.

Primary modules:
- `scripts/game.js`: constants, role/preset logic, phase processing, global handlers on `window`
- `scripts/render.js`: pure render functions by screen/phase, plus event listener wiring

Core phases:
- `reveal`
- `day`
- `night`
- `morning_doctor`
- `announcement`
- `discussion`
- `vote`
- `vote_announcement`
- `gameover`

## Source of Truth Files

- `INSTRUCTIONS.md`: rules and in-game behavior expectations (including tutorial content scope)
- `TODOS.md`: prioritized backlog and status
- `TESTING_LOG.md`: factual test outcomes and reproduction notes

If code behavior and docs diverge, update docs and/or code in the same work stream.

## Owner Directives (Must Follow)

These directives reflect explicit owner instructions and override defaults when they conflict:

- Keep architecture unchanged (`scripts/game.js` for logic/state, `scripts/render.js` for rendering/UI).
- Always update `TODOS.md` first when new directives arrive, before implementation.
- `TODOS.md` structure must remain:
  - `Major Overhauls`
  - `Priority-1: Bugs`
  - `Priority-2: Gameplay Improvements`
  - `Priority-3: Polishing`
  - `Priority-4: Multiplayer Management` (major multiplayer breakages still belong in Priority-1).
- Category boundaries:
  - `Priority-1: Bugs` is only for true malfunctions/regressions.
  - `Priority-2: Gameplay Improvements` is for behavior/design upgrades.
  - `Priority-3: Polishing` is for cosmetic/usability quality improvements.
- Keep the `Human-written uncategorized` section in `TODOS.md`; do not delete it.
- When uncategorized notes are added, convert them into clear categorized goals while preserving the raw uncategorized notes.
- Checkbox meaning in `TODOS.md`:
  - `[ ]` = not implemented
  - `[x]` = implemented in code
- If owner explicitly says "do not check anything off", keep all TODO boxes unchecked until told otherwise.
- Never mark an item complete unless every part of that item is fully fixed.
- After an item is carefully tested, remove it from `TODOS.md`.
- When owner requests coding-first mode:
  - implement all requested TODOs first (Priority-1 -> Priority-2 -> Priority-3 -> Priority-4)
  - do not run Playwright/browser testing until all requested implementation work is complete.
- Keep `INSTRUCTIONS.md` continuously aligned with current gameplay behavior (not only abstract rules).
- Multiplayer UX must stay non-technical for players:
  - labels use `Single-device` and `Multi-device`
  - no player-facing raw websocket/relay setup strings
  - expose room code + join URL + hotlink for multi-device host flow
  - support dedicated `join.html` join flow
  - join-code URLs should auto-enter join flow without requiring extra click prompts.
- Narration requirements:
  - human narrator gets first turn each phase
  - cues are phase-safe and non-role-spoiling
  - single-device cues are verbal; multi-device cues are chat-based.
- Map requirement tracking:
  - current gameplay logic may use graph data
  - roadmap requires floorplan-style map presentation with per-floor images and room-level connection notes.

## TODO Status Rules

`TODOS.md` uses one checkbox per item:
- `[ ]` = not implemented yet
- `[x]` = implemented in code

No separate "Completed" section.
Current team preference: once an item is thoroughly tested, remove it from `TODOS.md` so the file stays active-only.

## Testing Workflow

For any meaningful gameplay/UI change:
1. Run in browser (`python3 -m http.server 8000`).
2. Run quick static/smoke checks (`scripts/run_quick_checks.sh`).
3. If owner requested coding-first mode, defer Playwright until all requested implementation TODOs are complete.
4. Exercise changed flow with Playwright.
5. Log exact outcomes in `TESTING_LOG.md`.
6. Mark affected items as implemented (`[x]`) in `TODOS.md`; once thoroughly tested, remove those items from the active list.
7. Add notes to `progress.md`.

## Localhost + Playwright Notes

Use this exact sequence first:

```bash
cd /Users/saahir/Desktop/Coding/mafia-game
nohup python3 -m http.server 8000 >/tmp/mafia_http.log 2>&1 &
lsof -iTCP:8000 -sTCP:LISTEN -n -P
curl -I http://localhost:8000
```

Expected health check: `HTTP/1.0 200 OK`.

If you need Playwright coverage and MCP localhost is unavailable, run local Playwright from this workspace (same network namespace as the server):

```bash
cd /Users/saahir/Desktop/Coding/mafia-game
NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js
```

If Playwright is missing in this environment:

```bash
npm install -g playwright@1.58.2
playwright install chromium
```

Known constraints in this workspace:
- Playwright MCP may return `ERR_CONNECTION_REFUSED` for `http://localhost:8000` even when the server is healthy.
- Playwright MCP blocks `file://` URLs (`Allowed protocols: http:, https:, about:, data:`).
- Sometimes MCP gets stuck with `Another browser context is being closed`.
- For file-distributed builds, join URLs should point to sibling `join.html` (for example `file:///.../join.html?join=CODE`).

Fallback when MCP cannot hit localhost:

```bash
cd /Users/saahir/Desktop/Coding/mafia-game
npx --yes localtunnel --port 8000
# capture printed URL, e.g. https://<name>.loca.lt
curl -s https://loca.lt/mytunnelpassword
```

Then in Playwright MCP:
- Navigate to the `https://*.loca.lt` URL.
- Enter tunnel password from `https://loca.lt/mytunnelpassword`.

Important:
- If MCP gets stuck after tunnel/password flow, close/reopen the Playwright browser context and retry.
- Keep localhost server running; tunnel only proxies that same server.

## Current Product Intent (Do Not Drift)

These points are repeatedly emphasized by the user and should be treated as default requirements:
- Keep architecture as-is (`scripts/game.js` logic, `scripts/render.js` rendering).
- Multiplayer labels must be plain-language (`Single-device`, `Multi-device`) for non-technical users.
- Single-device mode should not show join links/codes.
- Single-device and multi-device both require at least 2 total players.
- Discussion must happen before voting (except solo simplifications).
- Multi-device chat should be prominent and available as part of the discussion workflow.
- Multi-device lobby should expose host/join using room code + generated URLs/hotlinks; do not expose raw websocket URLs to players.
- Device defaults should be sequential (`Device 1`, `Device 2`, ...), and players should be shown grouped per device.
- Narration is a major feature:
  - human narrator support without role-spoiling data
  - single-device narrator delivery is verbal
  - multi-device narrator delivery is chat-based
- Geography/map graph and narration engine are major systems and should stay aligned with `scripts/geography_data.js` + `scripts/narration_data.js`.
- `TODOS.md` is impact-first and status-driven (`[x]` means implemented; remove items after thorough testing).

## Commit Naming Guidance

Match existing repository style from project history:
- prefer concise imperative titles like `Fix ...`, `Add ...`, `Update ...`, `Refine ...`
- avoid scoped/conventional prefix style (for example `feat:`) unless user explicitly asks
- commit at meaningful milestones, not for every tiny edit

## Commit Policy

Commit when there is a meaningful milestone, especially after:
- resolving a high-impact bug
- completing a coherent feature slice
- finishing a docs + behavior alignment pass

Avoid giant mixed-purpose commits.

## Guardrails

- Preserve existing architecture and file split (`game.js` vs `render.js`).
- Do not silently change game rules in `INSTRUCTIONS.md` without approval.
- Prefer small, testable changes and frequent validation.
- Keep multiplayer and multi-device compatibility as first-class constraints.
