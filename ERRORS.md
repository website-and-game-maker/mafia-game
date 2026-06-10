# ERRORS.md — 2026-06-10 owner batch (12 items)

Status key: [ ] open · [x] fixed (tested before deletion per TODOS convention)

## Critical

- [x] **E1. Night turn order leaks roles** (item 10)
  - `getNightActors()` (game.js) returns `[mafia, detectives, villagers, doctors]` — in pass-and-play, whoever is handed the device first at night is mafia. Zero-information turn order required.
  - Fix: seating order (the order players sit/are listed), roles interleaved naturally.

- [x] **E2. "Someone was found dead during role reveal"** (item 11)
  - `withBotDelay()` callbacks are bare setTimeouts with no game/phase guard. Repro: finish a night so `processNight()` schedules `processMorning()` (game.js:3728), click New Game inside the delay window → `processMorning` fires during the new game's reveal and kills someone.
  - Fix: per-game epoch counter; `withBotDelay` aborts if the epoch changed; phase guard on the morning callback.

- [x] **E3. In-game `?` button does nothing** (item 12)
  - `renderGame()` never includes `renderInstructionsModal()` (it exists only on setup/lobby screens), so `showInstructions()` sets state that never renders.
  - Fix: render instructions (+settings) modals from renderGame; add a Terms/glossary tab (Disturbance, Exposure, Info, Reliability, Witness risk) so the concepts are learnable even after skipping the tutorial.

## High

- [x] **E4. Hosting requires a second pointless click** (item 1)
  - host.html shows another "Host Game" button before the room exists; QR joiners arrive before the host has started anything.
  - Fix: auto-open the room when host.html loads (one-shot, guarded); button becomes Disconnect/Reconnect.

- [x] **E5. Mobile chat blocks the UI + chat not always available** (item 3)
  - Corner chat panel overlays content on small screens and is read-only outside discussion.
  - Fix: collapsible floating 💬 drawer with unread badge (collapsed by default), chat writable during ALL in-game phases for multi-device; lobby chat already live.

- [x] **E6. No reconnect/leave handling** (item 4)
  - Accidental refresh mid-game: multiplayer cache restore exists for host; joiners rejoin via URL; solo has nothing. Player departure: nothing happens (game waits forever on their turn).
  - Design: device-presence watcher on host → banner with Wait (90s auto-timeout) / Remove-now; removed players are marked as having left (treated as eliminated; win conditions re-checked). Host disconnect → clients show grace banner then end the game. Solo: snapshot to localStorage each render; Resume card on reopen.

## Medium

- [x] **E7. Map hint arrow finicky/ugly on mobile** (item 5)
  - Fixed-position callout points at nothing on many layouts.
  - Fix: delete callout; pulse-ring highlight on the actual 🗺️ button + one inline first-run line under the phase header.

- [x] **E8. Mafia risk not separated from town exposure** (items 6+8)
  - Mafia route cards reuse the exposure pipeline labels and show "Snoop" tags / snoop-flavored options — confusing since mafia know each other.
  - Fix: mafia-facing stat renamed end-to-end to "👁 Witness risk" with its own accessor; no Snoop tags or info chips on mafia cards; reword counter-surveillance action.

- [x] **E9. Narration too flat** (item 7)
  - Static pack lines; outcomes (blocked break-in, escape, save, method, vote ties) never narrated.
  - Fix: context-aware narration composer that weaves the night/vote outcome into day/discussion/vote lines + richer human-narrator cues (public info only).

- [x] **E10. Lazy room detail strings** (item 9)
  - Raw `high_risk`, `sleep • rooms`, `traffic` tags shown to players.
  - Fix: humanized labels + per-type descriptions.

## To verify after fixes (item 2 + "test 3 games")

- [x] Mobile pass at 390×844: lobby, evening cards, night consoles, chat drawer, map modal, fullscreen QR, tutorial.
- [x] ≥3 full games in a real browser (plus sweep + 10-run matrix + live-site re-verify).

---
## Resolution (2026-06-10, same session)
All items fixed and verified: 21/21 focused checks, host-refresh reclaim test, sweep PASS, 10-run matrix 10/10 (10 full browser games), mobile screenshots reviewed (390×844). Details in TESTING_LOG Session 24.
