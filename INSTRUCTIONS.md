# Mafia Variant Rules And Full How-To Guide

Read this before your first game. This project is **not standard Mafia**.

This variant introduces:
- location planning
- exposure tradeoffs
- floorplan map context
- disturbance-based night attacks
- active non-mafia night stances
- structured multiplayer host/join flows

If you skip this guide, you will likely misread clues and vote badly.

---

## 1. What Makes This Different From Classic Mafia

Classic Mafia is mostly social deduction plus hidden role actions.
This variant keeps social deduction, but adds tactical systems:

1. Every player chooses locations and actions.
2. Your choices affect clue quality and danger.
3. The map and proximity matter for what players can notice.
4. Mafia does not just pick a victim; they also pick an attack method with disturbance effects.
5. Doctor saves are probabilistic and context-sensitive.
6. Discussion quality depends on timeline + location consistency, not just confidence.

This means:
- "who sounded convincing" is weaker evidence than "whose timeline and location claims still match the map and morning intel."

---

## 2. Win Conditions (Exact)

- Town wins when all Mafia are eliminated.
- Mafia wins when living Mafia are **greater than** living Town.

Important:
- Parity is not enough for Mafia in this version.
- A single kill does not auto-win Mafia.

Town includes all non-mafia roles:
- Villager-style town role (story-labeled)
- Doctor
- Detective

---

## 3. Core Concept: Exposure

**Exposure = your exposure to information and threats.**

Exposure controls a major tradeoff:
- Higher exposure usually gives stronger clues.
- Higher exposure also increases risk of being noticed or implicated.

Lower exposure usually means:
- safer movement
- weaker evidence
- more inconclusive morning results

UI behavior:
- Percentages use a green -> yellow -> red gradient.
- Action lists are sorted low -> high so the tradeoff is visible immediately.

How to use exposure well:
1. If your team lacks clues, push one or two high-exposure information plays.
2. If you already have a suspect set, lower exposure and test contradictions.
3. Do not let everyone high-exposure at once unless you accept chaotic evidence.

---

## 4. Roles And Practical Responsibilities

## 4.1 Town Role (setting-specific label)
Story label changes by setting:
- Blackwood Estate: Guest
- Midnight Express: Passenger
- Coral Bay Resort: Survivor
- Station Prometheus: Crewmate

Responsibilities:
- choose useful day plans
- take night stance seriously
- bring concrete statements to discussion
- vote based on consistency, not volume

## 4.2 Mafia
Mafia gets tactical control:
- choose day route actions by risk
- pick night target
- pick attack method (disturbance profile)
- receive mafia tactical notes (visibility/snooper activity)

Mafia cannot kill Mafia teammates.

Mafia strategy in this variant:
- not all mafia should use identical high-risk patterns
- fake consistency can be as powerful as fake confidence
- disturbance profile should match your social plan for next discussion

## 4.3 Detective
Detective advantages:
- stronger clue reliability
- lower notice risk
- better value from high-information routes

Detective mindset:
- avoid over-speaking early
- verify two-player contradictions before hard-committing
- use map proximity logic to challenge impossible claims

## 4.4 Doctor
Doctor changes in this variant:
- no medicine inventory/loadout system
- doctor acts in the morning doctor phase by choosing save target
- save chance is probabilistic, not guaranteed
- save chance drops when multiple attackers focus one victim
- higher-disturbance method profiles are generally harder to stabilize

Doctor best practice:
- use likely victim context + method profile + discussion contradictions
- do not assume certainty from one clue line

---

## 5. Geography And Floorplan Map System

The engine uses node/edge map logic for proximity.
Players see floorplan presentation for readability.

Each story provides:
- floor-level map images
- room-level notes tied to node ids
- connection notes for movement understanding

Map icon usage:
- available in-game
- open map to check floor context before making claims

Rule of thumb:
- if your accusation requires impossible movement distance, your accusation is weak.

---

## 6. Full Phase Flow

## 6.1 Reveal
- Each player privately views role.
- Pass prompts are neutral.
- Never announce role text out loud.

## 6.2 Day Planning
Each living participant chooses:
- location
- action
- optional target (if required)

Interpretation tips:
- snoop-tagged actions are clue-focused
- low exposure is safer but often less decisive

## 6.3 Night
Night actors take turns.

Mafia:
- selects target
- selects attack method

Non-mafia:
- chooses a night stance/action
- this is active play, not a skip phase

## 6.4 Morning Doctor
If there was a night attack and doctor is alive:
- doctor chooses save target

If no doctor phase is needed:
- flow moves forward automatically

## 6.5 Announcement
Public result appears first.
Important outcome data appears here before gameover logic.

## 6.6 Discussion
Discussion is before voting.

Single-device:
- timed discussion gate
- private vote turns after discussion

Multi-device:
- shared chat discussion
- host advances to vote when ready
- chat is part of evidence handling, not decoration

## 6.7 Vote
- each living voter submits one vote
- result includes elimination/tie and tally lines

## 6.8 Vote Announcement
Vote outcome is announced before next cycle / finalization.

## 6.9 Gameover
Winner resolves after announcement flow, not as abrupt instant cut.

---

## 7. Disturbance (Night Attack Methods)

Attack methods are labeled by disturbance percentage.

General interpretation:
- lower disturbance: usually fewer witnesses, often better stabilization chance
- higher disturbance: usually more witness opportunity, often harder stabilization chance

Methods are displayed low -> high disturbance in UI.

Do not reduce disturbance to one axis only.
In discussion, pair disturbance with:
- location
- map proximity
- who claimed nearby presence

---

## 8. Intel Interpretation Rules

Morning intel for non-mafia is never blank.

You may receive:
- strong hearing/sighting lines
- partial/noisy context
- inconclusive outcomes

Inconclusive does **not** mean useless.
It still narrows valid timelines when cross-checked with map distance and other claims.

Correct evidence handling flow:
1. Mark each statement as claim, clue, or conclusion.
2. Keep claims separate from conclusions.
3. Use clues to reject impossible claims.
4. Vote when enough claims fail consistency checks.

---

## 9. Narration System

## 9.1 Human Narrator Mode
- narrator gets first phase turn each phase
- cue must be acknowledged before normal turn flow continues
- cues must be phase-safe and non-spoiler

Delivery mode:
- single-device: read aloud
- multi-device: post in shared chat

## 9.2 Auto Narrator Mode
- uses narration packs
- keeps tone while avoiding private-role spoilers in public narration

Narrator is atmosphere + pacing support, not a source of hidden truth.

---

## 10. Presets And Role Balance

Role presets in this build are role-count templates.
They do not silently override core systems.
Preset descriptions are intentionally literal: percentages for Mafia/Doctor/Detective targets plus remaining Villagers.

## 10.1 Environment Rules In Settings (Core Logic Impact)

Settings now include an **Environment Rules** profile that directly changes gameplay calculations in every round.

Current profiles:
- **Balanced Rules**: baseline numbers (no modifier).
- **Midnight Silence**: lower exposure pressure, lower disturbance pressure, and easier doctor stabilization windows.
- **Panic Spiral**: higher exposure pressure, higher disturbance pressure, and harder doctor stabilization windows.

These are not cosmetic labels. They modify:
- exposure math used for clue/risk calculations
- disturbance values used in witness likelihood
- doctor difficulty penalties used in morning save outcomes

So the same role distribution can play very differently depending on this setting.

General advice:
- beginner groups: balanced setup
- advanced groups: slightly higher mafia pressure
- avoid setups near automatic mafia dominance

If lobby warnings appear, address warnings before start.

---

## 11. Single-Device Vs Multi-Device

## 11.1 Single-Device
- pass-and-play on one screen
- no room code/join link requirements
- still uses full phase structure

## 11.2 Multi-Device
- room code + shareable hotlink flow
- host controls room start and authoritative actions
- players grouped by device in lobby
- bots are host-managed global participants

---

## 12. Host And Join Flow (Practical Steps)

## 12.1 Host Flow
1. Enter multiplayer.
2. Choose host path.
3. Confirm room code and share fast link or QR (clicking the QR copies the join link).
4. Add local players for host device.
5. Wait for joiners to add players.
6. Validate role setup and setting.
7. Start game.

## 12.2 Join Flow
1. Enter multiplayer.
2. Choose join path.
3. Enter room code.
4. Join room and set device name.
5. Add players on that device.
6. Wait for host start.

If you are using a direct hotlink with `join` code embedded, join flow should pre-fill and auto-route.

## 12.3 Networking Modes In Settings
- **LAN Host URL**: preferred safe mode for local multiplayer; uses backend LAN URL (`http://<LAN_IP>:8000` style) when available.
- **Same URL**: uses the exact URL currently open in browser.
- **Custom**: manual portal + relay URLs for advanced setups.

Behavior:
- if backend cannot detect LAN IP, app automatically falls back to **Same URL**
- LAN mode is disabled (grayed out) until LAN URL is available
- local/static hosts automatically look for local room service and switch to it when ready

---

## 13. Device And Player Management Rules

- Players are grouped by device in multiplayer lobby.
- Host can reorder devices and player order when needed.
- Host can remove devices from room.
- Host-only bot control prevents conflicting room state.

Naming recommendations:
- set clear device names (for example, "Living Room iPad")
- avoid duplicate player names

---

## 14. Refresh / Resume Behavior

This build stores room context in cache and URL state for better recovery.

Practical expectation:
- if you refresh while connected, the app attempts to reconnect using URL room/join context
- host snapshots are cached to reduce accidental room-state loss on reload

Still recommended:
- avoid unnecessary refreshes during active elimination announcements or vote resolution

---

## 15. Strategy Guide (Town)

Town often loses by over-valuing confidence.

Better process:
1. Build a suspect pair, not a single hero call.
2. Ask each suspect for location + timing + nearby witness detail.
3. Compare against map possibility and intel lines.
4. Vote where contradictions persist after cross-check.

Town mistakes to avoid:
- believing first loud accusation
- treating inconclusive intel as zero value
- ignoring disturbance profile context
- voting before discussion consistency checks

---

## 16. Strategy Guide (Mafia)

Mafia often loses by repeating pattern-heavy actions.

Better process:
1. diversify route risk among mafia members
2. align disturbance choice with tomorrow’s narrative
3. avoid obvious contradiction with your own claimed movement
4. exploit overconfident town leaps, not only silence

Mafia mistakes to avoid:
- identical action signatures repeatedly
- high-disturbance when no social cover exists
- tunnel-killing the obvious suspect target every round

---

## 17. Discussion Protocol That Works

When someone claims evidence, ask:
1. Where exactly were you?
2. What did you choose there?
3. Who was nearby?
4. What did you hear/see exactly?
5. Why does that imply your conclusion?

If answer quality degrades at steps 3-5, confidence should drop.

Use this distinction every round:
- data: what happened
- interpretation: what you think it means

Never punish uncertainty when data is honest.
Punish inconsistent data.

---

## 18. Common New-Player Confusions

"I got inconclusive intel, so my turn was useless."
- false; it still constrains possible stories.

"Mafia reached parity, so game ends now."
- false; Mafia must strictly outnumber town.

"Doctor should always save the most suspicious person."
- not always; save logic is about likely victim and stabilization context.

"Narrator text is hidden truth."
- false; narrator sets pace and atmosphere without role spoilers.

---

## 19. Recommended First Session Settings

For brand-new groups:
- 4-6 total players
- 1 doctor
- 1 detective
- balanced preset
- human narrator if someone can facilitate
- for solo mode, narrator stays Auto-only

For experienced groups:
- larger lobbies
- stronger mafia pressure presets
- stricter discussion discipline

---

## 20. Safety / Fair Play Conventions

- Keep private screens private during reveal and private turns.
- Do not read role prompts aloud.
- Do not force dead players to reveal hidden details not in official announcements.
- In multiplayer, do not sabotage room controls if you are not host.

---

## 21. In-Game UI Reference

Important top-level controls:
- `?` opens instruction modal
- `⚙️` opens settings
- `🗺️` opens floorplan map in game

Lobby highlights:
- room code and fast link for multi-device host
- grouped players by device
- role balance editor

---

## 22. Troubleshooting

"Connection offline"
- verify host has opened room
- verify join code
- verify network/relay reachability
- if hosting from a static dev host, press **Host Game** to trigger automatic room-service setup

"I refreshed and got dropped"
- re-open the same room/join URL and reconnect
- host can remove stale devices if needed

"Copy button didn’t work"
- some browsers block clipboard in restricted contexts
- use fallback copy behavior or manual selection if needed

---

## 23. Glossary

Exposure:
- your exposure to information and threats

Disturbance:
- how noisy/disruptive a mafia method is

Inconclusive intel:
- data that cannot identify a clear culprit but still constrains possibilities

Host device:
- authoritative room controller in multi-device mode

Joiner device:
- connected client device adding local players to the same room

---

## 24. Final Reminder

This is a strategic social deduction variant.

To play it well:
1. learn exposure tradeoffs
2. use map logic
3. separate claims from conclusions
4. treat discussion as evidence processing
5. vote only after consistency checks

If your group does this, games become much deeper than classic bluff-only rounds.
