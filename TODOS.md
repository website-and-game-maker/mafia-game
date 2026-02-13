# TODO List

Status format per item:
- `Fixed` checkbox = implemented in code
- `Tested` checkbox = verified in browser/Playwright
- `🔧` = fixed in code but not yet tested

Priority legend:
- `Priority-0` = highest urgency
- `Priority-1` = core gameplay systems
- `Priority-2` = UX/instructions/atmosphere polish (merged old turn-flow + narration/polish buckets)
- `Priority-3` = deployment/infra/process support

---

## Major Overhauls (Priority-0, Multi-Session)

- 🔧 [x] Fixed | [ ] Tested - Geography graph + map system overhaul.
  Build a full node/edge geography model for each setting, including weighted movement, line-of-sight, hearing ranges, and edge types (for example: porches overlooking beach, bedrooms adjacent to hallway, mild audio bleed into nearby lobby nodes). Add a dedicated file describing the model and a dedicated data file for all map connections so night visibility, witness logic, snooping, and narration all use the same spatial source of truth.

- 🔧 [x] Fixed | [ ] Tested - Narrative story engine overhaul.
  Build preset backstory packs and phase narration templates that provide heavy intro story context, role-aware day/night lines, and a full morning narration sequence before discussion (including who died, who survived via medicine, and what happened). Keep narration dramatic but non-spoiler-safe for public phases.

---

## Priority-0 Mode Rules And Critical Flow Corrections

- 🔧 [x] Fixed | [ ] Tested - Rename multiplayer modes to plain language (`Single-device` / `Multi-device`) and remove technical protocol labels from player-facing UI.
- 🔧 [x] Fixed | [ ] Tested - Remove join code/link UI from single-device mode and prevent any `file://?join=` style link output.
- 🔧 [x] Fixed | [ ] Tested - Single-device mode requires at least 2 total players.
- 🔧 [x] Fixed | [ ] Tested - Multi-device mode requires at least 2 total players.
- 🔧 [x] Fixed | [ ] Tested - Provide robust local + internet play strategy and human-readable host/join connection UX (no localhost-only dead-end).
- 🔧 [x] Fixed | [ ] Tested - Preserve secrecy in pass-and-play prompts: never include role-revealing phrasing like "for mafia".
- 🔧 [x] Fixed | [ ] Tested - Single-device discussion flow: global discussion timer prompt (~5s) before per-player voting pass flow.
- 🔧 [x] Fixed | [ ] Tested - Multi-device discussion flow: shared chat-only discussion without pass-to-chat prompts.
- 🔧 [x] Fixed | [ ] Tested - Chat panel always visible in-corner during play when more than one device is connected.
- 🔧 [x] Fixed | [ ] Tested - Multi-device turn alerts and sequencing: show which device is active (`<Device Name> is up` when it is not your device), and support explicit device-order control alongside per-device player order.
- 🔧 [x] Fixed | [ ] Tested - Show vote tallies (counts per target) in results.

---

## Priority-1 Core Gameplay And Night-System Redesign

- 🔧 [x] Fixed | [ ] Tested - Replace separate risk/intel stats with one combined `Exposure` value and gradient percentage styling (green -> yellow -> red).
- 🔧 [x] Fixed | [ ] Tested - Expand each story map beyond 4 locations with role-aware location availability (town sleep zones, detective investigation zones, mafia movement zones).
- 🔧 [x] Fixed | [ ] Tested - Convert snooping to location-first geography behavior (snooping is where you go, target/person choice is the action decision).
- 🔧 [x] Fixed | [ ] Tested - Bedroom terminology/mechanics redesign: use shared bedroom geography (for example "their bedroom"), not singleton "your bedroom".
- 🔧 [x] Fixed | [ ] Tested - Bedroom action redesign: sleep and lock, sleep without locking, and porch/nearby vantage behavior.
- 🔧 [x] Fixed | [ ] Tested - Mafia location actions redesign: location-based kill options without over-the-top role reveal styling.
- 🔧 [x] Fixed | [ ] Tested - Remove or redesign broken mafia collaboration actions (`coordinate strike` and similar) with a clear, working alternative.
- 🔧 [x] Fixed | [ ] Tested - Nearby witness rule: if player is near a kill event, they reliably see meaningful evidence they can report.
- 🔧 [x] Fixed | [ ] Tested - Villager night behavior redesign: no full intel packet at night; night output is awareness/proximity clues and morning intel delivery.
- 🔧 [x] Fixed | [ ] Tested - Detective behavior redesign: always-alert copy/mechanics, stealth-lowered risk, and meaningful search choice set.
- 🔧 [x] Fixed | [ ] Tested - Doctor night medicine loadout system: choose medicine type in advance, independent of location.
- 🔧 [x] Fixed | [ ] Tested - Kill-method and treatment interaction system: mafia choose attack type, treatment efficacy depends on type, and morning reveals cause-of-death details.
- 🔧 [x] Fixed | [ ] Tested - Intel text guarantees: lock-room outcomes still return text, and failed findings return explicit \"inconclusive\" phrasing.
- 🔧 [x] Fixed | [ ] Tested - Mafia intel feed redesign: mafia get tactical movement/snooper-room knowledge instead of town-style intel packets.

---

## Priority-2 UX, Instructions, And Atmosphere (Merged Turn Flow + Atmosphere)

- 🔧 [x] Fixed | [ ] Tested - Rework presets so they are clearly and meaningfully different in playstyle.
- 🔧 [x] Fixed | [ ] Tested - Add player reordering in lobbies.
- 🔧 [x] Fixed | [ ] Tested - Restore auto-scroll-to-bottom behavior when adding many multiplayer names.
- 🔧 [x] Fixed | [ ] Tested - Remove the circular styling around the `?` help icon.
- 🔧 [x] Fixed | [ ] Tested - Tone down mafia-exclusive visual treatment (no heavy red bias, still clear to mafia players).
- 🔧 [x] Fixed | [ ] Tested - Rewrite instructions with instruction-first language (especially modes/discussion/voting usage flow, not feature-discovery wording).
- 🔧 [x] Fixed | [ ] Tested - Update detective helper copy to "always alert, never doze off" semantics.
- 🔧 [x] Fixed | [ ] Tested - Human narrator turn system: narrator gets one turn at the start of each phase with enough context to set mood without role-spoiling details; single-device narration is verbal guidance, multi-device narration uses chat-style prompts.
- 🔧 [x] Fixed | [ ] Tested - Promote high-impact options (like narrator mode/turn behavior) out of deep settings and into more visible flow controls; keep settings for fine-tuning only.

---

## Priority-3 Deployment, Verification, And Process

- [ ] Fixed | [ ] Tested - Align commit naming and commit timing with existing GitHub project history conventions.
- 🔧 [x] Fixed | [ ] Tested - Document launch recipes for local host mode, local multi-device relay mode, and internet-hosted mode.
- [x] Fixed | [x] Tested - Add repeatable verification checklist/scripts for single-device and multi-device regression.
- [x] Fixed | [x] Tested - Re-verify architecture boundary after overhaul: game logic in `scripts/game.js`, rendering in `scripts/render.js`.
