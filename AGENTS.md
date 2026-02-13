# Mafia Game Agent Guide

This file explains how coding agents should work in this repository.

## Project Goal

Build a browser-based Mafia game with:
- location-based intel/risk gameplay
- solo and multiplayer support
- compatibility across multiple devices
- a clear, testable day/night/discussion/vote loop

Do not rewrite the architecture unless explicitly approved.

## Quick Start

```bash
cd mafia-game
python3 -m http.server 8000
# Open http://localhost:8000
```

## Repository Layout

```
mafia-game/
├── index.html           # Entry point
├── styles/main.css      # Styling
├── scripts/
│   ├── game.js          # State, game logic, event handlers
│   └── render.js        # UI rendering functions
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

## TODO Status Rules

`TODOS.md` uses two explicit checkboxes per item:
- `Fixed`: code implemented
- `Tested`: behavior verified in browser/Playwright

Marker meanings:
- `[ ] Fixed | [ ] Tested` = not implemented
- `🔧 [x] Fixed | [ ] Tested` = implemented but not yet validated
- `[x] Fixed | [x] Tested` = implemented and validated

No separate "Completed" section. Keep items in their impact category.

## Testing Workflow

For any meaningful gameplay/UI change:
1. Run in browser (`python3 -m http.server 8000`).
2. Exercise changed flow with Playwright.
3. Log exact outcomes in `TESTING_LOG.md`.
4. Update affected items in `TODOS.md` (`Fixed` and `Tested`).
5. Add notes to `progress.md`.

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
