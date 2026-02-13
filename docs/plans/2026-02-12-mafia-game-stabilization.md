# Mafia Game Stabilization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align gameplay behavior, docs, and UX with the requested mafia variant while keeping the current architecture (`scripts/game.js` + `scripts/render.js`) intact.

**Architecture:** Keep single global state in `scripts/game.js` and phase-based rendering in `scripts/render.js`. Implement changes as narrow updates to state shape, phase processors, and phase renderers without introducing new framework/runtime dependencies.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Python static server, Playwright-based browser testing.

### Task 1: Documentation Alignment (Done in this session)

**Files:**
- Create: `AGENTS.md`
- Modify: `INSTRUCTIONS.md`
- Modify: `TODOS.md`
- Modify: `progress.md`

**Step 1: Add AGENTS guide**
- Document architecture and workflow constraints.

**Step 2: Expand game instructions**
- Include full functionality and tutorial expectations.

**Step 3: Rework TODO semantics**
- Use `Fixed`/`Tested` checkboxes and impact-based categories.

**Step 4: Log updates**
- Append notes in `progress.md`.

### Task 2: Gameplay Data Model Updates

**Files:**
- Modify: `scripts/game.js`
- Modify: `scripts/render.js`
- Modify: `styles/main.css`

**Step 1: Add small state fields for pacing/intel/narration helpers**
- Add controlled bot delay and intel helper defaults.

**Step 2: Refine role scaling presets**
- Adjust calculations for desired 12-player default trajectory with small-group safety.

**Step 3: Build richer location/action intel support**
- Introduce action categories (snoop/linger/hide/smoke etc.) and role modifiers.

**Step 4: Add deterministic/fallback intel outputs**
- Ensure every player gets non-empty intel text each morning.

### Task 3: Night Resolution Behavior

**Files:**
- Modify: `scripts/game.js`
- Modify: `scripts/render.js`

**Step 1: Mafia visibility pass**
- Compute nearby visibility and only broaden search when isolated.

**Step 2: Snoop placement model**
- Randomize snooping into limited room/person contexts (detective gets broader coverage).

**Step 3: Detective stealth logic**
- Lower mafia detection chance for detectives vs non-detectives.

**Step 4: Doctor probabilistic save**
- Save chance based on pressure (attack intensity) instead of guaranteed block.

### Task 4: Pass-And-Play + UX Flow Updates

**Files:**
- Modify: `scripts/render.js`
- Modify: `scripts/game.js`

**Step 1: Prompt wording updates**
- Replace role-leaking pass copy with neutral “Pass to <name>”.

**Step 2: Multiplayer name input behavior**
- Keep focus after Enter add.

**Step 3: Bot pacing**
- Introduce visible delay in bot turns and transitions.

**Step 4: Discussion/vote prompt consistency**
- Verify each human/device flow path prompts correctly.

### Task 5: Narration Scaffolding

**Files:**
- Modify: `scripts/game.js`
- Modify: `scripts/render.js`
- Modify: `styles/main.css`

**Step 1: Human narrator mode scaffolding**
- Add non-spoiler observer panel state and rendering.

**Step 2: Automated narrator presets scaffolding**
- Add preset tone options and phase-based narration generator.

**Step 3: Integrate with settings**
- Reuse existing settings modal toggles and add missing controls as needed.

### Task 6: Testing And Logging

**Files:**
- Modify: `TESTING_LOG.md`
- Modify: `TODOS.md`
- Modify: `progress.md`

**Step 1: Start local server and run Playwright scenarios**
- Cover setup, role reveal, day/night, morning, discussion, vote.

**Step 2: Log factual behavior**
- Record exact outcomes in `TESTING_LOG.md`.

**Step 3: Reconcile TODO statuses**
- Move items from fixed-not-tested to tested when verified.

**Step 4: Commit milestone**
- Commit docs + gameplay slices with clear messages.
