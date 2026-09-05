# TODO List

Status key:
- `[ ]` = not implemented yet
- `[x]` = implemented in code
- Deleted = tested

Completion rule:
- Never check an item unless every part of that item is fully fixed.
- Once an item is carefully tested, delete it from this file.

---

## Major Overhauls

No active items.

---

## Priority-1: Bugs

- [ ] **Full unredacted game state (including every player's secret role) is broadcast to and cached on every connected device.** `buildRealtimeStateSnapshot()` sends the entire `state` object (minus `network`) to all devices on every update; any player can open devtools (or just inspect `state.players` in console) and see who is Mafia/Doctor/Detective at any time. This defeats the hidden-information premise for realtime multiplayer. Fixing this properly means the host computing a per-recipient redacted snapshot instead of one shared broadcast — a real architecture change to the sync model, so it needs an explicit decision before implementing (flagged, not fixed, in the 2026-09 audit pass).
- [ ] **`action_request` has no sender-identity/ownership check**, only an action-name whitelist (fixed 2026-09). Any connected joiner can still invoke legitimate forwarded actions *as if* they were the host (e.g. `startGame`, `removePlayer` on someone else's seat, `adjustRole`) or as if it were a different player's turn (e.g. submit another player's vote/night action), because the relay never conveys the requesting device's id alongside `action_request` and the host-side handlers only check the *executing* device's own identity (which is always the host's). Needs: relay forwards sender `deviceId` with `action_request`; host-side handlers verify it matches the acting player's `deviceId` (for turn-scoped actions) or `state.network.isHost` semantics stay meaningful (for lobby-management actions).
- [ ] **Returning host past the 75s grace window gets silently redirected into a brand-new empty room** instead of an error or rejoin-as-participant. If the original host reconnects after another device was auto-promoted to host, `handleJoin`/`handle_join` (both relays) silently hand them a fresh room code with no diagnostic — they end up alone rebroadcasting a stale cached snapshot while the real game continues under the new host. Needs a clear "this room already has a different host now" message instead of a silent split.

---

## Priority-2: Gameplay Improvements

- [ ] **`ROLE_PRESETS`' percentage fields (`mafia`/`doctor`/`detective` as %) are dead data.** `calculateRolesFromPreset()` hardcodes a per-count table for each of the 4 known preset ids and never reads the percentages (the generic branch that would use them is unreachable). Anyone tuning balance by editing those percentages sees no effect, and the values don't describe the actual curve. Either wire the generic branch up for real, or replace the percentage fields with the real per-count tables (or a comment pointing at them) so the data isn't misleading.

---

## Priority-3: Feature Addition

No active items.

---

## Priority-4: Multiplayer Management

- [ ] **Production relay (`deno-deploy/relay.ts`) has no ping/pong heartbeat or idle-connection timeout**, unlike the dev relay (`scripts/realtime_server.py`, which sets `ping_interval=20`). A client that vanishes without a clean close (phone locked/backgrounded, wifi drop) leaves a zombie connection the production relay never detects — the 75s host-grace auto-promotion never fires for a frozen host, and rooms (with full state incl. every player's role) can linger in memory indefinitely since cleanup only happens on `clients.size === 0`.
- [ ] **No automatic reconnection after an unexpected mid-game socket drop.** `socket.onclose` just shows an error/offline state; recovery requires a full page reload (and a returning host can then hit the grace-window bug above).
- [ ] **A joiner's action silently falls back to running locally (non-authoritative) if the forward-to-host send fails** (socket not `OPEN` at that instant), producing a phantom, unsynced UI state that the next host broadcast then contradicts.
- [ ] **No rate limiting on room-code join attempts** (low priority — code space is large enough that this is defense-in-depth, not an active exploit path).
- [ ] **`renamePlayer` has no ownership check** — any caller can rename any other player, not just their own (low priority, griefing-level only).

---

## Priority-5: Polishing

- [ ] **Icon-only header buttons (⚙️ Settings, `?` Help, 🗺️ Map) have no `aria-label`** and rely on their glyph as the accessible name (a screen reader reads "?" as "question mark," not "Help").
- [ ] **All `.btn-icon` buttons have their focus outline forcibly removed** (`outline:none!important` in main.css) with no replacement focus style — keyboard users can't see which control is focused, on every screen.
- [ ] **Modals (Settings, Instructions, Map, big room code, tutorial, announcement) have no focus management, no Escape-to-close, and no ARIA dialog semantics** (`role="dialog"`/`aria-modal`) — keyboard users must tab through the whole underlying page to reach modal controls, with no way to back out via Escape.
- [ ] **The full Settings modal has no `max-height`/scroll constraint**, unlike the read-only join variant and the Instructions modal — on a phone with the Networking "Custom" fields and "Advanced networking details" expanded, the bottom of the modal (including the "Done" button) can become unreachable.
- [ ] **Drag-and-drop player reordering in the lobby is very likely non-functional on touchscreens** — it's implemented purely via the HTML5 Drag and Drop API with no touch-event fallback, and this is explicitly a phone-first, pass-and-play game. CSS for an up/down arrow-button fallback (`.order-btn`) still exists but is unused/dead — suggesting a touch-friendly control existed before and should be restored or reimplemented.
- [ ] **Settings checkboxes have no associated `<label>`** — only the 24×24px checkbox itself is clickable/tappable, not its row text.
- [ ] **Several touch targets are below the ~44×44pt guidance**: `.btn-adjust` (32×32, the role +/- steppers), `.remove-btn` (~28×30), `.chat-drawer-close` (28×28), `.btn-icon` (36×36).
- [ ] **Color system is fragmented**: phase-header colors (`render.js` `phaseColors`), `ROLES` colors, and preset colors are all separate hardcoded hex literals rather than referencing the `:root` CSS custom properties (`--purple-accent` etc.), so there are 3-4 near-duplicate "reds"/"greens" in play and changing a theme variable doesn't update them.
- [ ] **Dead CSS classes** with no remaining references anywhere in the codebase: `.map-node-grid`, `.map-node-pill`, `.map-hint-callout`/`.map-hint-arrow`/`.map-hint-text`, `.device-list`, `.order-btn`, `.player-device-chip`, `.device-name-input`, `.grid-4`. Also `renderMultiDeviceChatPanel`'s `corner` option (and its CSS, `.chat-panel-corner`) is never invoked with `corner:true` anywhere — only the separate `.chat-drawer` path is used.
- [ ] Two phase-header colors are reused for different phases (`day`/`vote` both `#eab308`; `announcement`/`vote_announcement`/`gameover` all `#ef4444`) — distinguishable by label text only, undercutting the at-a-glance phase-color signal.

---

## From the 2026-09 improvement audit (context)

The four items above marked "2026-09" came from a fresh 4-way parallel audit (gameplay/balance, multiplayer networking, rendering/UX/accessibility, docs/test-tooling) run when no backlog was queued. Already fixed in that same pass (not listed above — see git log): a critical XSS via unescaped player/bot/device names across render.js; the `action_request` whitelist-bypass RCE risk; a 2-human lobby able to start with 0 Mafia assigned; two doctors silently clobbering each other's nightly save target; a departed player's night/day vote not being purged; non-random mafia-vote tie-breaking; and a batch of stale docs (`CLAUDE.md`/`AGENTS.md`) and Playwright test selectors left over from earlier UI/data-model changes.
