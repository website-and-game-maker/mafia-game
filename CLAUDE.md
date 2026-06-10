# Mafia Game

A browser-based Mafia party game with location-based gameplay and an intel/risk system.

**Repo:** https://github.com/website-and-game-maker/mafia-game

---

## Quick Start

```bash
cd mafia-game
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## Project Files

```
mafia-game/
├── index.html           # Entry point
├── styles/main.css      # All styles
├── scripts/
│   ├── game.js          # Game logic, state, event handlers
│   └── render.js        # UI rendering functions
├── CLAUDE.md            # This file (project overview)
├── INSTRUCTIONS.md      # Game rules for players
├── TODOS.md             # Ordered task list
├── TESTING_LOG.md       # Test session logs
└── venv/                # Python dev server
```

**Note:** `original.html` is an old single-file version. Can be deleted.

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
- `screen` - Current screen (setup, solo_lobby, multi_lobby, game)
- `gamePhase` - Current phase (reveal, day, night, morning_doctor, announcement, discussion, vote, vote_announcement, gameover)
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

Actions have:
- `intel` (0-1) - Chance to learn something
- `risk` (0-5) - Danger level

Locations have base risk. Being where the murder happens = chance to witness. Detectives get bonuses.

---

## Key Code Patterns

### Adding a Location

In `game.js`, add to `STORY_PRESETS[].locations[]`:
```js
{
  id: 'lounge',
  name: 'Lounge',
  risk: 2,
  canLock: true,
  actions: [
    { id: 'relax', name: '☕ Relax', intel: 0.1, risk: 1, desc: 'Low key' },
    { id: 'snoop', name: '🔍 Snoop', intel: 0.6, risk: 4, desc: 'Risky' }
  ]
}
```

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
- Solo mode with bots
- All game phases
- Role reveal, day/night cycle, voting
- Game balance validation (Mafia >= Town blocked)
- Game ending explanations

### Needs Work
See `TODOS.md` for full list. Key items:
- Solo mode UX improvements
- Better role scaling for large games
- Intel/risk display improvements
- Multi-device multiplayer (WebSocket)
