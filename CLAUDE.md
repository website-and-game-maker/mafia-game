# Mafia Game

A browser-based Mafia party game with location-based gameplay and an intel/risk system.

**Repo:** https://github.com/website-and-game-maker/mafia-game

---

## Quick Start

```bash
cd mafia-game
python3 server.py
# Open http://localhost:8000
```

`server.py` is the unified local backend (serves the static site + the realtime relay). See [AGENTS.md](AGENTS.md) for the split-process fallback and direct entry points (`solo.html`, `host.html`, `join.html`).

---

## Project Files

```
mafia-game/
├── index.html           # Main entry (solo/multiplayer setup)
├── solo.html             # Solo-focused entry point
├── host.html             # Host-focused entry point
├── join.html             # Join-focused entry point
├── game.html             # Legacy flow alias (redirects to index with params)
├── server.py             # Unified local backend (HTTP + realtime relay)
├── styles/main.css      # All styles
├── assets/floorplans/   # Floorplan images by story/floor
├── scripts/
│   ├── game.js             # Game logic, state, event handlers
│   ├── render.js           # UI rendering functions
│   ├── geography_data.js   # Story map graphs (nodes/edges) + floorplan metadata
│   ├── narration_data.js   # Story narration packs/backstory templates
│   ├── realtime_server.py  # WebSocket relay for realtime multi-device sync
│   └── playwright_*.js     # Playwright regression/smoke scripts
├── deno-deploy/          # Production relay (Deno Deploy)
├── CLAUDE.md             # This file (project overview)
├── AGENTS.md             # Agent workflow guide (more detailed/current than this file)
├── INSTRUCTIONS.md       # Game rules for players
├── DEPLOYMENT.md         # Deploy instructions (static site + relay)
├── TODOS.md              # Ordered task list
├── TESTING_LOG.md        # Test session logs
├── progress.md           # Ongoing implementation/testing notes
└── venv/                 # Python dev server
```

---

## Tech Stack

- Vanilla JavaScript (no framework)
- CSS3 with custom properties
- Google Fonts (Playfair Display, Crimson Text)
- No build step - runs directly in browser

---

## Architecture

### State (`game.js`)

Single global `state` object holds everything:
- `screen` - Current screen (setup, solo_lobby, multi_lobby, join_entry, multi_entry, game)
- `gamePhase` - Current phase (reveal, day, night, announcement, discussion, vote, vote_announcement, gameover). There is no separate morning-doctor phase — the doctor's protect choice is made during `night`, and the save/death resolution happens inside `processMorning()` without its own phase.
- `players[]`, `bots[]` - Player/bot arrays with {id, name, role, alive, isBot}
- `roleConfig` - {mafia, doctor, detective, villager} counts
- `nightPlans{}`, `votes{}`, `intelResults{}` - Per-round data
- `winner`, `winReason`, `finalDeath` - End game state

### Rendering (`render.js`)

Pure functions that return HTML strings:
- `render()` - Main dispatcher
- `renderSetup()`, `renderSoloLobby()`, `renderMultiLobby()` - Lobby screens
- `renderGame()` - Game screen dispatcher
- `renderRevealPhase()`, `renderDayPhase()`, `renderNightPhase()`, etc. - Phase screens

### Event Handlers (`game.js`)

Global functions on `window`:
- Navigation: `goToSetup()`, `goToSoloLobby()`, `goToMultiLobby()`
- Players: `addBot()`, `removeBot()`, `addPlayer()`, `removePlayer()`
- Game: `selectLocation()`, `selectAction()`, `confirmDayPlan()`, `confirmVote()`
- Modals: `showInstructions()`, `showSettings()`, `hideInstructions()`, `hideSettings()`

---

## Game Flow

1. **Role Reveal** - Each player sees their role (Mafia see teammates)
2. **Day** - Choose location + action for the night
3. **Night** - Mafia picks target, actions resolve
4. **Morning** - Doctor saves (maybe), death announced
5. **Discussion** - Share intel, accuse, defend
6. **Vote** - Majority eliminates one player
7. Repeat until win condition

### Win Conditions
- **Town wins:** All Mafia eliminated
- **Mafia wins:** Mafia >= Town count

---

## Roles

| Role | Description |
|------|-------------|
| Villager | Basic town, votes and gathers intel |
| Mafia | Knows teammates, kills at night |
| Doctor | Can save one player each morning |
| Detective | Better intel gathering, harder to catch |

---

## Intel/Risk System

Locations are nodes in a per-story geography graph (`scripts/geography_data.js`), not static objects with hardcoded actions. Each node has a base `exposure` (0-1, derived from its `type` via `EXPOSURE_BY_NODE_TYPE` unless overridden), and edges between nodes carry `distance`/`sight`/`hearing` used for witness/proximity checks.

Actions are built dynamically per node via `buildAction()` (`scripts/game.js`):
- `exposure` (0-1) - Danger of being seen/caught, blended from location + action exposure
- `info` (0-1) - Chance to learn something, driven by action *kind* (`INFO_BY_ACTION_KIND`) independently of exposure — hiding is safe but blind, snooping is loud but informative
- `toLegacyRisk(exposure)` maps exposure to the old 0-5 risk scale for display/back-compat

Being where the murder happens = chance to witness. Detectives get bonuses (lower exposure, higher info). Gameplay presets (`getGameplayMod()`) and Environment Rules profiles further modify these multipliers.

---

## Key Code Patterns

### Adding a Location

In `scripts/geography_data.js`, add a node to the relevant story's `nodes[]` (id/name/type/tags), wire it into `edges[]` (distance/sight/hearing to at least one existing node), and add it to a floor's `rooms[]` in `floorplan` (with a floorplan image + connection notes if needed). Actions for the node are generated automatically by `buildAction()`/`buildLocationActions()` in `scripts/game.js` based on the node's `type`/exposure — you don't hand-author per-location action lists.

### Adding a Role

1. Add to `ROLES` constant
2. Update `calculateRolesFromPreset()` for auto-assignment
3. Add UI in `renderRoleConfig()`
4. Handle behavior in phase processors

### Styling

CSS variables in `:root`:
- `--bg-dark`, `--bg-card` - Backgrounds
- `--text-primary`, `--text-secondary` - Text
- `--purple-accent`, `--red-accent`, `--green-accent` - Colors

---

## Important Functions

| Function | Purpose |
|----------|---------|
| `canStart()` | Validates game can begin |
| `getStartWarnings()` | Returns warning messages |
| `checkWin()` | Checks win conditions, sets winner |
| `processNight()` | Resolves Mafia target |
| `processMorning()` | Handles Doctor save, announces death |
| `processVote()` | Tallies votes, eliminates player |
| `botMakeDecisions()` | AI decision-making |

---

## Files for Tracking

- **TODOS.md** - Ordered task list (bugs, features, polish)
- **TESTING_LOG.md** - Test sessions and checklists
- **INSTRUCTIONS.md** - Player-facing game rules

---

## Workflow

### Fixing Errors
When fixing bugs from TODOS.md, **spawn multiple agents in parallel** for independent fixes. Each agent handles one error, then results are reviewed together. This speeds up development.

Example: If there are 3 bugs to fix, spawn 3 agents simultaneously rather than fixing sequentially.

### Testing
After fixes, run through TESTING_LOG.md checklist. Log results. Any new bugs go to TODOS.md (in priority order, not just at the end).

---

## Current Status

### Working
- Solo mode with bots, pass-and-play (single-device), and realtime multi-device multiplayer (WebSocket relay, host-authoritative)
- All game phases, role reveal, day/night cycle, voting
- Geography-graph based locations with exposure/info mechanics, floorplan visuals, and narration
- Game balance validation (Mafia >= Town blocked), game ending explanations

### Needs Work
See `TODOS.md` for the current backlog (empty means no open items — the project is between improvement passes).
