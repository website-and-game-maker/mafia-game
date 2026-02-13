# Mafia Rules And Gameplay Guide

This document is the source of truth for:
- game rules
- role behavior
- phase flow
- gameplay functionality the in-game tutorial must explain

Do not change core win/role rules without approval.

## Win Conditions

- Town wins when all Mafia are eliminated.
- Mafia wins when living Mafia count is equal to or greater than living non-Mafia count.

## Roles

### Town (Story-Named Role)
- Story-specific town names are used in UI:
  - Blackwood Estate: `Guest`
  - Midnight Express: `Passenger`
  - Coral Bay Resort: `Survivor`
  - Station Prometheus: `Crewmate`
- Gathers clues and votes.
- Does not get a guaranteed direct identity result; usually gets proximity/awareness clues unless they witness events.

### Mafia
- Knows all Mafia teammates.
- Cannot target Mafia teammates.
- During day planning, chooses location and mafia route action.
- During night strike turn, chooses:
  - target (based on map visibility)
  - kill method (noise and treatment difficulty vary)
- Receives tactical mafia-only knowledge (movement context + snooper sightings), not town-style intel cards.

### Doctor
- At night, chooses one medicine loadout to prepare.
- In morning doctor phase, chooses one player to attempt to save.
- Save chance is probabilistic and depends on:
  - attack method difficulty
  - medicine matchup
  - number of attackers (multi-attacker focus sharply lowers save chance)

### Detective
- Always alert, never "dozes off" into passive lock behavior.
- Uses snoop/linger posture with stronger clue quality.
- Has lower notice chance when Mafia scans for snoopers.

## Geography + Exposure System

### Unified Exposure
- The game uses one unified percentage metric: `Exposure`.
- Exposure replaces separate risk/intel presentation.
- Higher Exposure generally means:
  - higher chance to collect stronger clues
  - higher chance to be noticed/implicated
- Exposure visuals use a continuous green -> yellow -> red gradient.

### Map Graph
- Each story uses a node/edge graph (see `scripts/geography_data.js`).
- Graph data includes:
  - nodes (bedroom zones, investigation zones, shared areas, transit, isolated spaces)
  - weighted edges with sight/hearing characteristics
- Night visibility and nearby witness logic use graph distance, not flat same-room checks.

### Location Model
- Locations are generated from story graph nodes.
- Stories now have more than four locations and role-aware action sets.
- Bedroom/sleep areas are shared geography zones (not "your bedroom" singleton copy).

## Day And Night Flow

## 1. Role Reveal
- Each player privately sees role information.
- Mafia sees teammates.
- Pass-and-play prompts are neutral (`Pass to <name>`), with no role leak wording.

## 2. Day Planning
Each living player selects:
- location
- location action
- optional action target (if action requires a person)

Important:
- Snoop behavior is location-first (investigation zones), with target selection as the action choice.
- Bedroom behavior is action-based (for example: sleep and lock, sleep unlocked, porch watch), not a separate lock prompt.

## 3. Night Turns
- Human night actors proceed in sequence:
  - human Mafia (target + kill method)
  - human Doctor (medicine loadout)
- Bots auto-resolve their equivalent night decisions.

## 4. Morning Doctor
- Doctor chooses who to save using prepared medicine.
- Save resolution is probabilistic and method-sensitive.

## 5. Morning Announcement
- Public outcome includes death/survival and cause/method details when applicable.
- Narration is shown before discussion continues.

## 6. Discussion
- Discussion always occurs before voting in non-solo flows.
- Single-device multiplayer: short timed discussion gate, then private vote turns.
- Multi-device: shared chat discussion, then host advances to voting.

## 7. Vote
- Every living voter submits one vote.
- Vote result announces elimination or tie.
- Vote tally counts are displayed.

## Intel Output Requirements

- Every non-Mafia player receives a morning intel payload (never blank).
- If nothing strong is found, intel text is explicitly inconclusive (not empty).
- Locked/sleep outcomes still produce meaningful text.
- Nearby kill witnesses get meaningful evidence cues.
- Detectives more often get clearer identity/movement clues.

## Modes

### Solo
- One human player plus bots.
- Faster flow, but still includes intel -> discussion/vote transition.

### Multiplayer Single-Device
- One shared device, private pass flow for private turns.
- No join-link/join-code sharing UI in this mode.
- Requires at least 2 total players.

### Multiplayer Multi-Device
- Devices connect to a shared room/relay.
- Discussion uses shared chat.
- Chat is visible in-corner during play when more than one device is connected.
- Device turn banner indicates active device.
- Host can reorder connected device order.
- Requires at least 2 total players.

## Presets

Role presets must be meaningfully different in actual playstyle:
- `Classic`: mafia-heavy baseline with support roles.
- `Blood Moon`: very high mafia pressure, minimal support.
- `Aftershock`: volatile but not pure mafia stack.
- `Forensics`: detective-heavy information game.

Classic default target at 12 players remains:
- 5 Mafia / 3 Doctors / 2 Detectives / 2 Town

Small-lobby scaling must remain safe and non-breaking.

## Narration System

Two narrator styles:

### Human Narrator Mode
- Gets one phase-level cue each phase.
- Cues are non-spoiler and non-personalized.
- Single-device: delivered verbally.
- Multi-device: delivered via chat-style prompt.
- Includes a phase-safe narration feed panel.

### Auto Narrator Mode
- Uses story packs and phase templates.
- Includes heavier backstory intro and phase atmosphere lines.
- Story narration preset data is defined in `scripts/narration_data.js`.

## In-Game Tutorial Coverage (Required)

Tutorial content must explicitly cover:
1. Win conditions.
2. Role responsibilities.
3. Exposure-driven day planning (location/action/target).
4. Night turns by role (Mafia strike method, Doctor medicine, Detective posture).
5. Morning intel interpretation (including inconclusive outcomes).
6. Discussion and voting flow.
7. Single-device vs multi-device mode behavior.
8. Multi-device chat and sender attribution usage.
9. Narrator mode behavior and expectations.
