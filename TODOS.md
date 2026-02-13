# TODO List

Prioritize high-impact gameplay blockers first.

Status format per item:
- `Fixed` checkbox = implemented in code
- `Tested` checkbox = verified in browser/Playwright
- `🔧` = fixed in code but not yet tested

---

## P0 Critical Gameplay Gaps

- [x] Fixed | [x] Tested - Night intel can be empty; always show a meaningful fallback in "Your intel".
- [x] Fixed | [x] Tested - Mafia visibility model: show nearby people/actions first; only broaden view when no one is nearby.
- [x] Fixed | [x] Tested - Snoop model should target a small set of rooms/people (roughly 3 contexts, 5 for detectives), not omniscient visibility.
- [x] Fixed | [x] Tested - Detective stealth should reduce chance of being noticed by Mafia.
- [x] Fixed | [x] Tested - Doctor saves should be probabilistic and reduced by multiple attackers.
- [x] Fixed | [x] Tested - Pass-and-play prompts should never reveal role labels ("Pass to <name>" only).
- [x] Fixed | [x] Tested - Ensure discussion phase exists before voting for all non-solo games.
- [x] Fixed | [x] Tested - Validate and message role balance safety (including mafia pressure warning/blocking behavior before start).

## P1 Core Gameplay And Balance

- [x] Fixed | [x] Tested - Better role scaling implemented, with validation against desired default balance curve.
- [x] Fixed | [x] Tested - Default preset balancing target: 12 players should trend toward 5 Mafia, 3 Doctors, 2 Detectives, with safe fallback for smaller groups.
- [x] Fixed | [x] Tested - Rework presets so Brutal/Chaos/Mystery are clearly distinct and intentional.
- [x] Fixed | [x] Tested - Add clearer mafia-only planning options and labeling.
- [x] Fixed | [x] Tested - Ensure snooping actions can target specific people/rooms.
- [x] Fixed | [x] Tested - Expand location-specific actions by risk tier (not generic action pools).
- [x] Fixed | [x] Tested - Lock vs listen mechanics restored; verify risk/intel effect in play.
- [x] Fixed | [x] Tested - Risk/intel badges improved; verify percentages + color clarity end-to-end.

## P2 Turn Flow And UX

- [x] Fixed | [x] Tested - Solo flow partially simplified; no unnecessary pass/reveal prompts in solo.
- [x] Fixed | [x] Tested - Enter adds multiplayer names; no duplicate submit issues seen in regression run.
- [x] Fixed | [x] Tested - Keep name input focused after Enter so bulk entry is fast.
- [x] Fixed | [x] Tested - Slow bot transitions slightly so turns feel readable (without adding manual clicks).
- [x] Fixed | [x] Tested - Mafia target cards show location + action details; verified during night targeting.
- [x] Fixed | [x] Tested - Day planning privacy hides other players' planned actions.
- [x] Fixed | [x] Tested - Discussion-to-vote flow prompts every player/device consistently in pass-and-play.

## P3 Multiplayer And Cross-Device

- [ ] Fixed | [ ] Tested - Multi-device lobby and device list (hide device list when only one device is present).
- [ ] Fixed | [ ] Tested - Make chat prominent in multi-device discussion.
- [ ] Fixed | [ ] Tested - Message attribution when one device has multiple players.
- [ ] Fixed | [ ] Tested - WebSocket real-time support (currently pass-and-play oriented).

## P4 Narration, Atmosphere, And Polish

- [x] Fixed | [ ] Tested - Robust narration system:
  - human narrator mode with broad visibility but no secret-role spoilers
  - automated narrator mode with tone presets
- [ ] Fixed | [ ] Tested - Bot chat lines during discussion.
- 🔧 [x] Fixed | [ ] Tested - Wire settings toggle to real sound effects in gameplay.
- [ ] Fixed | [ ] Tested - Wire settings toggle to visible death animations.
- [x] Fixed | [x] Tested - Favicon 404 suppression.

## P5 Project Hygiene

- [ ] Fixed | [ ] Tested - Keep `scripts/game.js` and `scripts/render.js` separated by responsibility.
- [ ] Fixed | [ ] Tested - Maintain occasional compressed backup snapshot in parent directory.
