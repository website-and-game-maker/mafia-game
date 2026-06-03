# Major Overhauls + 10-Run Regression Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement both major overhauls (multi-page flow split and floorplan map UI), verify all raw TODO items are truly implemented, and run/log a 10-run feature-complete regression.

**Architecture:** Keep `scripts/game.js` as state/logic and `scripts/render.js` as rendering; add thin entry-flow scripts and new pages without migrating core logic. Replace map modal rendering with floorplan asset + metadata presentation while preserving graph-based gameplay logic.

**Tech Stack:** Vanilla HTML/CSS/JS, Playwright (Node), existing Python HTTP + realtime relay.

### Task 1: Entry-Flow Site Split (Major Overhaul 1)

**Files:**
- Create: `host.html`
- Create: `game.html`
- Create: `scripts/flow_host.js`
- Create: `scripts/flow_join.js`
- Create: `scripts/flow_game.js`
- Modify: `index.html`
- Modify: `join.html`
- Modify: `scripts/game.js`

**Steps:**
1. Add dedicated page entries for host/join/game flows.
2. Add tiny flow scripts that set global entry mode hints.
3. Update `scripts/game.js` initialization to honor entry mode hints while preserving existing behavior.
4. Keep link generation and join auto behavior compatible with new page layout.

### Task 2: Floorplan Map Presentation (Major Overhaul 2)

**Files:**
- Create: `assets/floorplans/*` (per-story, per-floor image files)
- Modify: `scripts/geography_data.js`
- Modify: `scripts/game.js`
- Modify: `scripts/render.js`
- Modify: `styles/main.css`

**Steps:**
1. Add floorplan metadata to each story (floors, room notes, connection notes).
2. Add floorplan assets and wire image paths.
3. Replace graph visual map modal with floorplan tabbed modal per floor.
4. Keep map icon and exposure/risk context readable.

### Task 3: Raw-Item Verification + TODO Cleanup

**Files:**
- Modify: `TODOS.md`

**Steps:**
1. Verify each raw item against code behavior.
2. Delete raw entries once confirmed implemented.
3. Remove tested TODO entries from active sections.
4. Leave only unresolved work (if any).

### Task 4: Docs Alignment

**Files:**
- Modify: `INSTRUCTIONS.md`
- Modify: `AGENTS.md`
- Modify: `progress.md`

**Steps:**
1. Update gameplay/map/site-flow docs to match implementation.
2. Keep owner workflow semantics accurate in AGENTS.
3. Append progress notes for handoff clarity.

### Task 5: 10-Run Regression + Logging

**Files:**
- Create: `scripts/playwright_ten_run_matrix.js`
- Modify: `TESTING_LOG.md`

**Steps:**
1. Add deterministic-ish Playwright matrix runner with 10 runs:
   - solo runs
   - single-device multiplayer runs
   - multi-device realtime runs
2. Validate major features each run (setup/instructions/settings/lobby/game phases/chat/map/narrator/realtime).
3. Execute matrix and summarize pass/fail by run.
4. Log complete outcomes to `TESTING_LOG.md`.

### Verification Commands

1. `bash scripts/run_quick_checks.sh`
2. `node --check scripts/game.js`
3. `node --check scripts/render.js`
4. `node --check scripts/geography_data.js`
5. `python3 -m py_compile scripts/realtime_server.py`
6. `NODE_PATH=$(npm root -g) node scripts/playwright_button_sweep.js`
7. `NODE_PATH=$(npm root -g) node scripts/playwright_ten_run_matrix.js`

