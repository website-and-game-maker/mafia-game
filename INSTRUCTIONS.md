# Mafia Rules And Gameplay Guide

Read this full document before play.  
This project is a custom Mafia variant with location planning, exposure tradeoffs, map-based proximity, and custom narrator flow.

This file is the source of truth for:
- rules
- role behavior
- phase flow
- multiplayer behavior
- tutorial coverage requirements

---

## 1. Win Conditions

- Town wins when all Mafia are eliminated.
- Mafia wins when living Mafia are **greater than** living Town (strict outnumber, not parity).

Town = everyone who is not Mafia (`villager`, `doctor`, `detective`).

---

## 2. Core Concept: Exposure

`Exposure` means your exposure to information and threats.

Higher exposure usually means:
- stronger chance of useful clues
- stronger chance of being noticed or implicated

Lower exposure usually means:
- safer movement
- weaker or inconclusive evidence

UI note:
- Exposure/risk badges are shown as percentages with a continuous green -> yellow -> red gradient.
- Action lists are ordered from lower percentage to higher percentage.

---

## 3. Roles

### Town (story-named role)
- Story label changes by setting:
  - Blackwood Estate: `Guest`
  - Midnight Express: `Passenger`
  - Coral Bay Resort: `Survivor`
  - Station Prometheus: `Crewmate`
- Chooses day location/action.
- Takes a night stance turn.
- Uses morning intel + discussion to vote.

### Mafia
- Knows all Mafia teammates.
- Cannot kill Mafia teammates.
- During day planning, picks location + Mafia route action.
- At night, picks:
  - kill target (based on visibility rules)
  - attack method (ordered low disturbance -> high disturbance)
- Receives tactical mafia notes (movement/snooper visibility), not town intel cards.
- Mafia UI decisions center on tactical visibility and disturbance, not town exposure scoring.

### Detective
- Always alert (never “dozes off”).
- Takes day planning and night stance turns.
- Lower notice risk and generally stronger clue quality.

### Doctor
- No medicine loadout system.
- Takes day planning and night stance turns.
- In morning doctor phase, chooses who to save.
- Save chance is probabilistic and reduced by multi-attacker focus.
- More disruptive attack profiles are harder to save.

---

## 4. Geography And Map System

- Every story is a node/edge map (`scripts/geography_data.js`).
- Nodes represent areas (sleep clusters, investigation zones, shared spaces, transit, isolated rooms).
- Edges include distance/sight/hearing traits.
- Night proximity, witness chance, and “who was nearby” outcomes use map distance.
- A map icon is available in-game so any player can open the visual map.

---

## 5. Phase Flow

## 5.1 Reveal
- Each player privately views role.
- Pass prompts are neutral (`Pass to <name>`); never role-revealing.

## 5.2 Day Planning
- Every living human chooses:
  - location
  - action
  - target (only if the action requires one)
- Villager/detective help:
  - snoop-tagged actions are highlighted as clue-focused choices.

## 5.3 Night
- Human actors take turns in sequence.
- Mafia: choose target + attack method.
- Non-mafia (villager/detective/doctor): take a night stance/action turn (not skipped).
- Bots simulate equivalent decisions with configured delay pacing.

## 5.4 Morning Doctor
- If there was a night attack and at least one doctor is alive:
  - doctor chooses a save target.
- If no applicable doctor phase is needed, resolution proceeds automatically.

## 5.5 Announcement
- Public event output is shown before winner declaration.
- Cause/method details are included for night kills when applicable.

## 5.6 Discussion
- Discussion occurs before voting in non-solo flows.
- Single-device multiplayer: timed discussion gate, then private vote pass flow.
- Single-device and solo do not use a live device chat feed.
- Multi-device multiplayer: shared chat discussion, then host advances to voting.
- In multi-device games, chat remains visible during play/discussion so players can follow device-to-device conversation before voting.

## 5.7 Vote
- Every living voter submits one vote.
- Result shows elimination/tie plus vote tally lines.

Important social rule:
- A claim in discussion is not automatically true.
- A player may report true evidence, lie as Mafia, or troll.
- Compare timeline, proximity, and contradictions before voting.

---

## 6. Intel Output Rules

- Non-Mafia players always receive morning intel text (never blank).
- Inconclusive outcomes are explicitly labeled as inconclusive.
- Locked/sleep states still produce text.
- Nearby witnesses can get heard/saw style evidence.
- Night stance influences clue likelihood.

---

## 7. Attack Method Terms

Player-facing wording uses `Disturbance` (not technical internals).

Interpretation:
- Lower disturbance:
  - usually less witness visibility
  - often easier stabilization chance
- Higher disturbance:
  - usually more witness visibility
  - often lower stabilization chance

Methods are displayed low disturbance -> high disturbance.

---

## 8. Modes

### Solo
- One human + bots.

### Multiplayer Single-Device
- Pass-and-play on one screen.
- Requires at least 2 total players.
- No join links/codes shown in this mode.

### Multiplayer Multi-Device
- Multiplayer entry provides two choices: `Host` and `Join Game`.
- Requires at least 2 total players.
- Lobby shows:
  - room code
  - join portal URL
  - direct hotlink URL
- Player-facing lobby text avoids raw relay/socket URLs.
- Join links containing `?join=<CODE>` should enter the join flow immediately.
- Players are grouped by device.
- Bots are global (not per device) and host-managed.
- Host can reorder device order and per-device player order via drag handles.
- During play, active device banner shows whose device is currently up.

---

## 9. Narration System

### Human Narrator Mode
- Narrator gets the first phase turn each phase and must acknowledge before player turns continue.
- Cue is phase-level and non-spoiler (no secret role leakage).
- Single-device: narrator reads cue aloud.
- Multi-device: narrator posts cue in chat before actions proceed.

### Auto Narrator Mode
- Uses story preset backstory and phase text packs (`scripts/narration_data.js`).
- Uses role-aware tone sets without exposing private role secrets in public narration.
- Tone options remain configurable in settings.

---

## 10. Presets And Settings

- Role presets are role-count templates only.
- Story/atmosphere/system tuning is configured separately.
- Presets must avoid invalid or parity-start setups for normal lobby sizes.

---

## 11. Tutorial Coverage (Required)

In-game tutorial content must explicitly cover:
1. win conditions (including strict outnumber rule)
2. exposure meaning and tradeoff
3. role responsibilities
4. day location/action/target planning
5. night actor flow (Mafia strike + non-mafia night stances)
6. morning doctor save logic
7. discussion truth uncertainty (claims can be true, false, or manipulative)
8. vote flow and tally interpretation
9. single-device vs multi-device differences
10. multi-device chat usage before voting (and during active discussion flow)
11. narrator mode expectations (verbal vs chat cue)
