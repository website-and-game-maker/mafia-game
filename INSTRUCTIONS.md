# Mafia Rules And Gameplay Guide

This document is the source of truth for:
- game rules
- role behavior
- phase flow
- gameplay functionality the in-game tutorial must explain

Do not change core rules without approval.

## Win Conditions

- Town wins when all Mafia are eliminated.
- Mafia wins when living Mafia count is equal to or greater than living non-Mafia count.

## Roles

### Villager
- No special power.
- Chooses location/action each day-night cycle.
- Uses intel and discussion to vote.

### Mafia
- Knows all Mafia teammates.
- Cannot kill Mafia teammates.
- At night, Mafia chooses kill targets and uses mafia-only planning options.
- Mafia should clearly see that mafia choices are mafia-only.

### Doctor
- Chooses one save target in the morning phase.
- Saves are probabilistic (not guaranteed).
- Multiple attackers should make a successful save less likely.

### Detective
- Uses snooping/lingering style play (not "locked room" defensive behavior).
- Better at gathering intel than villagers.
- Lower chance of being noticed by Mafia while investigating.

## Round Structure

### 1. Role Reveal
- Each player privately sees their role.
- Mafia also sees teammates.
- In pass-and-play, prompts should say "Pass to [player name]" and avoid exposing role labels in pass text.

### 2. Day Planning
Each living player selects:
- a location
- a location-specific action
- optional door stance when available (lock vs listen/open)

Important behavior:
- plans remain private during planning
- locations/actions have clear risk and intel levels
- higher risk generally increases potential intel
- role identity influences available options and outcomes

### 3. Night Resolution
- Mafia chooses kill target(s) from eligible non-Mafia players.
- Mafia gets situational visibility based on who is around their active area.
- If nobody is around a Mafia member, Mafia may infer broader location info due to active searching.
- Snoopers/investigators should be sampled into a small set of observed room contexts (for example ~3 room contexts, ~5 for detectives), not omnipresent everywhere.

### 4. Morning
- Doctor save happens (if doctor alive/eligible).
- Death or survival outcome is announced.
- Intel is delivered to players.
- "No intel" outcomes should still show a meaningful baseline message instead of blank sections.

### 5. Discussion
- Discussion always exists before voting in multiplayer and single-device pass-and-play.
- Solo mode can keep discussion lightweight but should still present intel and transition clearly.
- Multi-device mode should make chat prominent.
- If a device has multiple players, chat messages must attribute sender identity.

### 6. Voting
- Every living player votes.
- Elimination result is announced.
- Role of eliminated player is revealed.
- New round begins unless game is over.

## Intel And Risk System

### Core Principle
Higher risk should generally yield higher potential intel.

### Inputs To Risk
- location base risk
- action risk
- door stance (lock/listen)
- role modifiers (especially detective stealth advantage)

### Inputs To Intel
- action intel value
- proximity to events
- role modifiers (detective bonus)
- whether player was actively snooping/lingering

### Intel Output Requirements
- Every player should receive a result payload each morning:
  - direct observations when successful
  - nearby presence clues when applicable
  - explicit "nothing conclusive" or equivalent fallback when nothing was detected
- Mafia night view should include contextual target details (location/action) when visible.

## Location And Action Design

- Actions are location-specific and should not feel generic across all places.
- Each setting should include low/medium/high risk options.
- Example action families:
  - snoop/search/follow
  - smoke/linger in exposed areas
  - hide/lock up for safety
  - listen through door for risky intel
- Mafia should also have distinct planning actions separate from town actions.

## Modes

### Solo (Human + Bots)
- No pass-and-play privacy prompts.
- Fast but readable flow.
- Bot turns should not feel instantaneous; include pacing delay or staged narration.

### Multiplayer Pass-And-Play (Single Device)
- Private role/action prompts.
- Explicit pass-to-player wording.
- Discussion phase still required before vote.

### Multiplayer Multi-Device
- Uses join code/lobby and per-device player assignment.
- Chat is a primary UI element during discussion.
- Real-time sync behavior should remain compatible with single-device flow.

## Presets And Role Scaling

- Presets should be meaningfully distinct (avoid near-duplicates).
- Default preset target for 12 players is mafia-heavy with support roles (5 Mafia, 3 Doctors, 2 Detectives, 2 Villagers), while still scaling safely for smaller groups.
- Preset math must not break small lobbies.

## Narration Requirements

Two supported narration styles:
- Human narrator support mode:
  - can view broad game flow
  - cannot see secret-role data that would spoil the game
- Automated narrator mode:
  - configurable style presets
  - phase-by-phase atmospheric summaries and prompts

## In-Game Tutorial Requirements

The tutorial should explicitly cover:
1. Win conditions.
2. Role responsibilities.
3. Day planning (location, action, risk/intel, door choices).
4. Night behavior by role (Mafia/Doctor/Detective/Villager).
5. Morning intel interpretation.
6. Discussion and voting flow.
7. Mode differences (solo, pass-and-play, multi-device).
8. Chat attribution rules for multi-player devices.
9. Narration options and intended use.

## Design Notes (No Rule Change)

Current rule set is strong on social deduction and risk/reward. The main quality risk is complexity overload for new players. To keep your rules intact while improving usability:
- make role-specific options visually obvious
- keep intel phrasing simple and consistent
- ensure tutorial and phase prompts mirror each other exactly
